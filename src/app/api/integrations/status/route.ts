import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleTokenHealth } from '@/lib/integrations/google/tokens';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const [{ data: integrations, error }, google] = await Promise.all([
      supabase
        .from('integrations')
        .select('service, provider, status, account_email, account_id, scopes, metadata, last_sync_at')
        .eq('user_id', user.id),
      getGoogleTokenHealth(user.id).catch(() => ({
        tokenPresent: false,
        refreshAvailable: false,
        scopes: []
      }))
    ]);

    if (error) throw error;

    let rows = integrations || [];

    // A stale CONNECTED row without a usable token must never appear healthy.
    if (!google.tokenPresent) {
      const staleGoogle = rows.some(
        row => row.provider === 'GOOGLE' && row.status === 'CONNECTED'
      );

      if (staleGoogle) {
        await supabase
          .from('integrations')
          .update({
            status: 'ACTION_REQUIRED',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('provider', 'GOOGLE')
          .eq('status', 'CONNECTED');

        rows = rows.map(row =>
          row.provider === 'GOOGLE' && row.status === 'CONNECTED'
            ? { ...row, status: 'ACTION_REQUIRED' }
            : row
        );
      }
    }

    return NextResponse.json({
      success: true,
      integrations: rows,
      google: {
        tokenPresent: google.tokenPresent,
        refreshAvailable: google.refreshAvailable,
        expiresAt: google.expiresAt,
        scopes: google.scopes
      }
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
