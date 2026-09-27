import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeGoogleToken } from '@/lib/integrations/google/client';
import {
  deleteGoogleTokens,
  getGoogleTokenForRevocation
} from '@/lib/integrations/google/tokens';

const GOOGLE_SERVICES = [
  'GOOGLE_ACCOUNT',
  'GMAIL',
  'GOOGLE_CALENDAR',
  'GOOGLE_DRIVE',
  'GOOGLE_SHEETS',
  'GOOGLE_CONTACTS'
];

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    let revokedAtGoogle = false;

    try {
      const token = await getGoogleTokenForRevocation(user.id);
      if (token) revokedAtGoogle = await revokeGoogleToken(token);
    } catch {
      // Local disconnect still proceeds if Google's revoke endpoint is unavailable.
    }

    await deleteGoogleTokens(user.id);

    const { error } = await supabase
      .from('integrations')
      .update({
        status: 'DISCONNECTED',
        account_email: null,
        account_id: null,
        scopes: [],
        last_sync_at: null,
        metadata: {},
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('provider', 'GOOGLE')
      .in('service', GOOGLE_SERVICES);

    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'GOOGLE_WORKSPACE_DISCONNECTED',
      module: 'INTEGRATIONS',
      details: { revoked_at_google: revokedAtGoogle }
    });

    return NextResponse.json({
      success: true,
      revokedAtGoogle,
      message: 'Google Workspace disconnected.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
