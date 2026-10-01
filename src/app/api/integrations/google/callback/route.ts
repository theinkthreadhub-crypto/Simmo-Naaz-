import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForGoogleTokens, getGoogleUserProfile } from '@/lib/integrations/google/client';
import { encryptToken } from '@/lib/integrations/crypto';
import { GOOGLE_STATE_COOKIE, validateGoogleOAuthState } from '@/lib/integrations/google/oauthState';

const PRODUCTION_APP_URL = 'https://mentra.inkthreadhub.in';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const origin =
    process.env.NODE_ENV === 'production'
      ? PRODUCTION_APP_URL
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

  const redirect = (status: 'error' | 'success', message: string) => {
    const target = new URL('/connections', origin);
    target.searchParams.set('status', status);
    target.searchParams.set(status === 'success' ? 'service' : 'message', message);
    const response = NextResponse.redirect(target);
    response.cookies.set(GOOGLE_STATE_COOKIE, '', { path: '/api/integrations/google', maxAge: 0 });
    return response;
  };

  if (error || !code || !state) {
    return redirect('error', error || 'MISSING_AUTH_CODE');
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate session user matches state token
  if (!user) {
    return redirect('error', 'UNAUTHENTICATED');
  }
  if (!validateGoogleOAuthState(state, req.cookies.get(GOOGLE_STATE_COOKIE)?.value, user.id)) {
    return redirect('error', 'INVALID_STATE_TOKEN');
  }
  const targetUserId = user.id;

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCodeForGoogleTokens(code);

    // 2. Fetch Google User Profile (email)
    const profile = await getGoogleUserProfile(tokens.accessToken);

    // 3. Encrypt Tokens (AES-256-GCM)
    const encryptedAccess = encryptToken(tokens.accessToken);
    // Google may omit a refresh token on reconnect. Keep an existing valid envelope.
    const { data: previous, error: previousError } = await supabase.from('integration_tokens')
      .select('encrypted_refresh_token, refresh_token_iv, refresh_token_tag')
      .eq('user_id', targetUserId).eq('provider', 'GOOGLE').maybeSingle();
    if (previousError) throw new Error('TOKEN_LOOKUP_FAILED');
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    const previousRefresh = previous?.refresh_token_iv && previous?.refresh_token_tag ? previous : null;
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    // 4. Upsert integration_tokens (Server-only table)
    const { error: tokenError } = await supabase
      .from('integration_tokens')
      .upsert({
        user_id: targetUserId,
        provider: 'GOOGLE',
        encrypted_access_token: encryptedAccess.ciphertext,
        encrypted_refresh_token: encryptedRefresh?.ciphertext || previousRefresh?.encrypted_refresh_token || null,
        refresh_token_iv: encryptedRefresh?.iv || previousRefresh?.refresh_token_iv || null,
        refresh_token_tag: encryptedRefresh?.tag || previousRefresh?.refresh_token_tag || null,
        token_iv: encryptedAccess.iv,
        token_tag: encryptedAccess.tag,
        expires_at: expiresAt,
        scopes: tokens.scopes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' });

    if (tokenError) {
      console.error('[GOOGLE CALLBACK ERR]: Token save error:', tokenError);
      return redirect('error', 'TOKEN_PERSISTENCE_FAILED');
    }

    // 5. Upsert active services in integrations table
    const services = ['GOOGLE_ACCOUNT', 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'GOOGLE_CONTACTS'];
    for (const s of services) {
      const { error: integrationError } = await supabase
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
      if (integrationError) return redirect('error', 'INTEGRATION_PERSISTENCE_FAILED');
    }

    return redirect('success', 'google');
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK ERROR]:', err);
    return redirect('error', 'GOOGLE_CONNECTION_FAILED');
  }
}
