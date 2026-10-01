import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuthUrl } from '@/lib/integrations/google/client';
import { createGoogleOAuthState, GOOGLE_STATE_COOKIE, GOOGLE_STATE_TTL_SECONDS } from '@/lib/integrations/google/oauthState';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL('/connections?error=UNAUTHORIZED', req.url));
  }

  // Create state token binding user_id to prevent CSRF
  const statePayload = createGoogleOAuthState(user.id);

  const authUrl = getGoogleOAuthUrl(statePayload);
  const response = NextResponse.redirect(new URL(authUrl, req.url));
  response.cookies.set(GOOGLE_STATE_COOKIE, statePayload, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/api/integrations/google', maxAge: GOOGLE_STATE_TTL_SECONDS
  });
  return response;
}
