import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let { data, error } = await supabase
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
.select('worker_id, status, last_seen_at, metadata')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (hb?.last_seen_at) {
      workerLastSeen = hb.last_seen_at;
      workerOnline = hb.status === 'ONLINE' && (Date.now() - new Date(hb.last_seen_at).getTime()) < 120_000;
    }
  } catch {
    // Non-critical if table query fails
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

export const maxDuration = 30;

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const { data: currentSession } = await supabase
      .from('whatsapp_qr_sessions')
      .select('status, qr_code, qr_expires_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = Date.now();
    const qrStillValid =
      currentSession?.status === 'QR_READY' &&
      Boolean(currentSession?.qr_code) &&
      Boolean(currentSession?.qr_expires_at) &&
      new Date(currentSession.qr_expires_at).getTime() > now;

    const recentlyWaiting =
      currentSession?.status === 'WAITING_QR' &&
      Boolean(currentSession?.updated_at) &&
      now - new Date(currentSession.updated_at).getTime() < 90_000;

    if (!qrStillValid && !recentlyWaiting) {
      await runAsTrustedServer('whatsapp_qr_fresh_pairing', async () => {
      const admin = createClient();

      const { error: signalError } = await admin
        .from('whatsapp_worker_signal_keys')
        .delete()
        .eq('user_id', user.id);
      if (signalError) throw signalError;

      const { error: authError } = await admin
        .from('whatsapp_worker_auth')
        .delete()
        .eq('user_id', user.id);
      if (authError) throw authError;

      const { error: connectionError } = await admin
        .from('whatsapp_connections')
        .update({
          status: 'DISCONNECTED',
          verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      if (connectionError) throw connectionError;

      const { error: qrError } = await admin
        .from('whatsapp_qr_sessions')
        .upsert({
          user_id: user.id,
          worker_id: 'mentra-brain-01',
          status: 'WAITING_QR',
          qr_code: null,
          qr_expires_at: null,
          connected_number: null,
          connected_at: null,
          last_error: null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (qrError) throw qrError;
      });
    }

    // Render free services can sleep. A QR request must also wake the brain-worker,
    // otherwise the UI can remain stuck on WAITING_QR with no QR payload.
    const workerUrl = (
      process.env.BRAIN_WORKER_URL ||
      process.env.NEXT_PUBLIC_BRAIN_WORKER_URL ||
      'https://mentra-brain-worker.onrender.com'
    ).replace(/\/$/, '');

    let workerAwake = false;
    try {
      const wake = await fetch(`${workerUrl}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });
      workerAwake = wake.ok;
    } catch {
      // The request itself wakes a sleeping Render service. QR polling will
      // pick up QR_READY once the worker finishes booting.
    }

    return NextResponse.json({
      success: true,
      status: 'WAITING_QR',
      workerWakeRequested: true,
      workerAwake
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

