import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    // 1. Delete token record
    await supabase
      .from('integration_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'GOOGLE');

    // 2. Mark Google services as DISCONNECTED
    const services = ['GOOGLE_ACCOUNT', 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'GOOGLE_CONTACTS'];
    for (const s of services) {
      await supabase
        .from('integrations')
        .update({
          status: 'DISCONNECTED',
          account_email: null,
          last_sync_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('service', s);
    }

    return NextResponse.json({ success: true, message: 'Google integration disconnected successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
