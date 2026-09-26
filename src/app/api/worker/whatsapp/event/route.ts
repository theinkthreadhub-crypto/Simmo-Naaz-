import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyBrainWorkerSecret } from '@/lib/worker/auth';

const allowedStatuses = new Set([
  'WAITING_QR',
  'QR_READY',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR'
]);

export async function POST(req: NextRequest) {
  if (!verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'))) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.userId !== 'string' || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: 'INVALID_EVENT' }, { status: 400 });
  }

  const now = new Date();
  const qrReady = body.status === 'QR_READY' && typeof body.qr === 'string';

  const supabase = createClient();
  const { error } = await supabase.from('whatsapp_qr_sessions').upsert({
    user_id: body.userId,
    worker_id: typeof body.workerId === 'string' ? body.workerId : 'brain-worker',
    status: body.status,
    qr_code: qrReady ? body.qr : null,
    qr_expires_at: qrReady ? new Date(now.getTime() + 75_000).toISOString() : null,
    connected_number:
      typeof body.connectedNumber === 'string' ? body.connectedNumber : null,
    last_error: typeof body.error === 'string' ? body.error.slice(0, 1000) : null,
    connected_at: body.status === 'CONNECTED' ? now.toISOString() : null,
    updated_at: now.toISOString()
  }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
