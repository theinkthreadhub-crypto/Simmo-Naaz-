import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    await runAsTrustedServer('whatsapp_disconnect', async () => {
      const admin = createClient();
      const now = new Date().toISOString();

      const { error: signalError } = await admin.from('whatsapp_worker_signal_keys').delete().eq('user_id', user.id);
      if (signalError) throw signalError;

      const { error: authError } = await admin.from('whatsapp_worker_auth').delete().eq('user_id', user.id);
      if (authError) throw authError;

      const { error: connectionError } = await admin
        .from('whatsapp_connections')
        .update({ status: 'DISCONNECTED', verified: false, updated_at: now })
        .eq('user_id', user.id);
      if (connectionError) throw connectionError;

      const { error: qrError } = await admin
        .from('whatsapp_qr_sessions')
        .update({
          status: 'DISCONNECTED',
          qr_code: null,
          qr_expires_at: null,
          connected_number: null,
          connected_at: null,
          last_error: null,
          updated_at: now
        })
        .eq('user_id', user.id);
      if (qrError) throw qrError;
    });

    return NextResponse.json({ success: true, message: 'WhatsApp disconnected.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
