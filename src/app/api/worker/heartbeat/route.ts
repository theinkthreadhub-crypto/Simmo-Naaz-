import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

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

  const workerId = typeof body.workerId === 'string' ? body.workerId : 'brain-worker';
  const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;
  const status = typeof body.status === 'string' ? body.status.slice(0, 40) : 'ONLINE';

  const writeHeartbeat = async () => {
    const supabase = createClient();
    const { error } = await supabase.from('brain_worker_heartbeats').upsert({
      worker_id: workerId,
      user_id: userId,
      status,
      metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'worker_id' });

    if (error) throw error;
  };

  try {
    await runAsTrustedServer('brain_worker_heartbeat', writeHeartbeat);
    return NextResponse.json({ success: true, serverTime: new Date().toISOString() });
  } catch (error: any) {
    console.warn('[Heartbeat write skipped]', error?.message || error);
    const credential = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
    let credentialRole = credential.startsWith('sb_secret_') ? 'secret' : 'unknown';
    if (credential.split('.').length === 3) {
      try { credentialRole = JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString()).role || 'unknown'; } catch {}
    }
    return NextResponse.json({ success: false, error: 'HEARTBEAT_PERSISTENCE_FAILED', databaseCredentialConfigured: Boolean(credential), databaseCredentialRole: credentialRole }, { status: 503 });
  }
}

