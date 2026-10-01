import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });

  const { data: connection, error: connectionError } = await supabase
    .from('whatsapp_connections')
    .select('status, verified, phone_number, display_phone_number, last_active_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (connectionError) return NextResponse.json({ success: false, error: connectionError.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    pairingMethod: 'QR_ONLY',
    connection: connection || { status: 'DISCONNECTED', verified: false, phone_number: null, display_phone_number: null }
  });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'LINK_CODE_DISABLED',
    message: 'MENTRA supports WhatsApp QR pairing only.'
  }, { status: 410 });
}
