import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuthUrl } from '@/lib/integrations/google/client';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL('/connections?error=UNAUTHORIZED', req.url));
  }

  // Create state token binding user_id to prevent CSRF
  const statePayload = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now()
  })).toString('base64url');

  const authUrl = getGoogleOAuthUrl(statePayload);
  return NextResponse.redirect(authUrl);
}
