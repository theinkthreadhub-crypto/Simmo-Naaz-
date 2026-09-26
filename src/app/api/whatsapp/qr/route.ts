import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await supabase
    .from('whatsapp_qr_sessions')
    .select(
      'status, qr_code, qr_expires_at, connected_number, connected_at, last_error, updated_at'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const expired = data?.qr_expires_at
    ? new Date(data.qr_expires_at).getTime() <= Date.now()
    : false;

  return NextResponse.json({
    status: data?.status || 'DISCONNECTED',
    qr: expired ? null : (data?.qr_code || null),
    qrExpiresAt: data?.qr_expires_at || null,
    connectedNumber: data?.connected_number || null,
    connectedAt: data?.connected_at || null,
    lastError: data?.last_error || null,
    updatedAt: data?.updated_at || null
  });
}
