import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeCodeForGoogleTokens,
  getGoogleUserProfile,
  GOOGLE_SERVICE_SCOPE_REQUIREMENTS
} from '@/lib/integrations/google/client';
import { verifyGoogleOAuthState } from '@/lib/integrations/google/oauthState';
import { storeGoogleTokens } from '@/lib/integrations/google/tokens';

const PRODUCTION_APP_URL = 'https://mentra.inkthreadhub.in';

function appOrigin(req: NextRequest): string {
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_APP_URL
    : process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

function redirectError(origin: string, message: string) {
  return NextResponse.redirect(
    `${origin}/connections?status=error&message=${encodeURIComponent(message)}`
  );
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const providerError = url.searchParams.get('error');

  if (providerError) return redirectError(origin, providerError);
  if (!code || !state) return redirectError(origin, 'MISSING_AUTH_CODE_OR_STATE');

  let verifiedState: { userId: string; issuedAt: number; nonce: string };
  try {
    verifiedState = verifyGoogleOAuthState(state);
  } catch (error) {
    return redirectError(
      origin,
      error instanceof Error ? error.message : 'INVALID_STATE_TOKEN'
    );
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirectError(origin, 'UNAUTHENTICATED_CALLBACK');
  }

  if (user.id !== verifiedState.userId) {
    return redirectError(origin, 'OAUTH_STATE_USER_MISMATCH');
  }

  try {
    const tokens = await exchangeCodeForGoogleTokens(code);
    const profile = await getGoogleUserProfile(tokens.accessToken);

    await storeGoogleTokens(user.id, tokens);

    const grantedScopes = new Set(tokens.scopes);
    const now = new Date().toISOString();

    const services = Object.entries(GOOGLE_SERVICE_SCOPE_REQUIREMENTS).map(
      ([service, requiredScopes]) => {
        const missingScopes = requiredScopes.filter(scope => !grantedScopes.has(scope));
        return {
          user_id: user.id,
          provider: 'GOOGLE',
          service,
          status: missingScopes.length === 0 ? 'CONNECTED' : 'ACTION_REQUIRED',
          account_email: profile.email,
          account_id: profile.id || null,
          scopes: tokens.scopes,
          last_sync_at: now,
          metadata: {
            account_name: profile.name || null,
            missing_scopes: missingScopes,
            oauth_verified_at: now
          },
          updated_at: now
        };
      }
    );

    const { error: integrationError } = await supabase
      .from('integrations')
      .upsert(services, { onConflict: 'user_id,service' });

    if (integrationError) throw new Error(integrationError.message);

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'GOOGLE_WORKSPACE_CONNECTED',
      module: 'INTEGRATIONS',
      details: {
        account_email: profile.email,
        services: services.map(service => ({
          service: service.service,
          status: service.status
        }))
      }
    });

    const allConnected = services.every(service => service.status === 'CONNECTED');

    return NextResponse.redirect(
      `${origin}/connections?status=${allConnected ? 'success' : 'partial'}&service=google`
    );
  } catch (error) {
    return redirectError(
      origin,
      error instanceof Error ? error.message : 'GOOGLE_CALLBACK_FAILED'
    );
  }
}
