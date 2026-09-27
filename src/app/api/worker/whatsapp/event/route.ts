import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

const allowedStatuses = new Set([
  'WAITING_QR',
  'QR_READY',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR'
]);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signedWorker = verifyBrainWorkerSignature(
    req.headers.get('x-mentra-worker-timestamp'),
    req.headers.get('x-mentra-worker-signature'),
    rawBody
  );
  const tokenWorker = verifyBrainWorkerToken(
    req.headers.get('x-mentra-worker-token')
  );
  const legacyWorker = verifyBrainWorkerSecret(
    req.headers.get('x-mentra-internal-secret')
  );

  if (!signedWorker && !tokenWorker && !legacyWorker) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody || '{}');
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  if (typeof body.userId !== 'string' || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: 'INVALID_EVENT' }, { status: 400 });
  }

  const now = new Date();
  const qrReady = body.status === 'QR_READY' && typeof body.qr === 'string';

  try {
    await runAsTrustedServer('brain_worker_whatsapp_event', async () => {
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

      if (error) throw error;
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'WHATSAPP_EVENT_FAILED' }, { status: 500 });
  }
}
