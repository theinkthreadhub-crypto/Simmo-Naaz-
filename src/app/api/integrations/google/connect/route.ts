import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuthUrl } from '@/lib/integrations/google/client';
import { createGoogleOAuthState } from '@/lib/integrations/google/oauthState';

const PRODUCTION_APP_URL = 'https://mentra.inkthreadhub.in';

function appOrigin(req: NextRequest): string {
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_APP_URL
    : process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);

  if (process.env.GOOGLE_ENABLED === 'false') {
    return NextResponse.redirect(
      `${origin}/connections?status=error&message=GOOGLE_INTEGRATION_DISABLED`
    );
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(
      `${origin}/connections?status=error&message=UNAUTHORIZED`
    );
  }

  try {
    const state = createGoogleOAuthState(user.id);
    return NextResponse.redirect(getGoogleOAuthUrl(state));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GOOGLE_OAUTH_CONFIG_ERROR';
    return NextResponse.redirect(
      `${origin}/connections?status=error&message=${encodeURIComponent(message)}`
    );
  }
}
