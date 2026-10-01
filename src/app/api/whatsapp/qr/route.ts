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

  // Check worker heartbeat to report whether brain-worker is actively running
  let workerOnline = false;
  let workerLastSeen: string | null = null;
  try {
    const { data: hb } = await supabase
      .from('brain_worker_heartbeats')
      .select('worker_id, status, last_seen_at')
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (hb?.last_seen_at) {
      workerLastSeen = hb.last_seen_at;
      workerOnline = (Date.now() - new Date(hb.last_seen_at).getTime()) < 120_000;
    }
  } catch {
    // Non-critical if table query fails
  }

  // Also check whatsapp_connections for active linked state
  if ((!data || data.status === 'DISCONNECTED') && user?.id) {
    try {
      const { data: conn } = await supabase
        .from('whatsapp_connections')
        .select('status, phone_number, last_active_at')
        .eq('user_id', user.id)
        .eq('status', 'CONNECTED')
        .maybeSingle();

      if (conn?.phone_number) {
        return NextResponse.json({
          status: 'CONNECTED',
          qr: null,
          qrExpiresAt: null,
          connectedNumber: conn.phone_number,
          connectedAt: conn.last_active_at,
          lastError: null,
          updatedAt: conn.last_active_at,
          workerOnline: true,
          workerLastSeen: conn.last_active_at || new Date().toISOString()
        });
      }
    } catch {
      // Non-critical
    }
  }

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
    updatedAt: data?.updated_at || null,
    workerOnline,
    workerLastSeen
  });
}

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const { error } = await supabase
      .from('whatsapp_qr_sessions')
      .upsert({
        user_id: user.id,
        worker_id: 'brain-worker',
        status: 'WAITING_QR',
        qr_code: null,
        qr_expires_at: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, status: 'WAITING_QR' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

