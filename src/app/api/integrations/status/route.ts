import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: true, integrations: [] });
  }

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('service, status, account_email, scopes, last_sync_at')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const list = [...(integrations || [])];

  // Also query whatsapp_connections to populate WHATSAPP_CLOUD_API status
  try {
    const { data: waConn } = await supabase
      .from('whatsapp_connections')
      .select('status, phone_number, display_phone_number, last_active_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (waConn && waConn.status === 'CONNECTED') {
      const waIndex = list.findIndex(i => i.service === 'WHATSAPP_CLOUD_API');
      const waItem = {
        service: 'WHATSAPP_CLOUD_API',
        status: 'CONNECTED',
        account_email: waConn.display_phone_number || (waConn.phone_number ? `+${waConn.phone_number}` : 'Connected'),
        scopes: ['messages', 'audio', 'notifications'],
        last_sync_at: waConn.last_active_at || new Date().toISOString()
      };
      if (waIndex >= 0) {
        list[waIndex] = waItem;
      } else {
        list.push(waItem);
      }
    }
  } catch {
    // Non-critical
  }

  return NextResponse.json({ success: true, integrations: list });
}
