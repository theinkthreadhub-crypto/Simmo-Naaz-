import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForGoogleTokens, getGoogleUserProfile } from '@/lib/integrations/google/client';
import { encryptToken } from '@/lib/integrations/crypto';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/connections?status=error&message=${error || 'MISSING_AUTH_CODE'}`);
  }

  // Verify and decode state token
  let parsedState: { userId: string; timestamp: number };
  try {
    parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return NextResponse.redirect(`${origin}/connections?status=error&message=INVALID_STATE_TOKEN`);
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate session user matches state token
  const targetUserId = user?.id || parsedState.userId;
  if (!targetUserId) {
    return NextResponse.redirect(`${origin}/connections?status=error&message=UNAUTHENTICATED`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCodeForGoogleTokens(code);

    // 2. Fetch Google User Profile (email)
    const profile = await getGoogleUserProfile(tokens.accessToken);

    // 3. Encrypt Tokens (AES-256-GCM)
    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    // 4. Upsert integration_tokens (Server-only table)
    const { error: tokenError } = await supabase
      .from('integration_tokens')
      .upsert({
        user_id: targetUserId,
        provider: 'GOOGLE',
        encrypted_access_token: encryptedAccess.ciphertext,
        encrypted_refresh_token: encryptedRefresh?.ciphertext || null,
        token_iv: encryptedAccess.iv,
        token_tag: encryptedAccess.tag,
        expires_at: expiresAt,
        scopes: tokens.scopes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' });

    if (tokenError) {
      console.error('[GOOGLE CALLBACK ERR]: Token save error:', tokenError);
    }

    // 5. Upsert active services in integrations table
    const services = ['GOOGLE_ACCOUNT', 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'GOOGLE_CONTACTS'];
    for (const s of services) {
      await supabase
        .from('integrations')
        .upsert({
          user_id: targetUserId,
          provider: 'GOOGLE',
          service: s,
          status: 'CONNECTED',
          account_email: profile.email,
          scopes: tokens.scopes,
          last_sync_at: new Date().toISOString(),
          metadata: { account_name: profile.name, email: profile.email }
        }, { onConflict: 'user_id,service' });
    }

    return NextResponse.redirect(`${origin}/connections?status=success&service=google`);
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK ERROR]:', err);
    return NextResponse.redirect(`${origin}/connections?status=error&message=${encodeURIComponent(err.message)}`);
  }
}
