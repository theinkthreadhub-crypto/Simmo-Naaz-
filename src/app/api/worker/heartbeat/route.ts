import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyBrainWorkerSecret } from '@/lib/worker/auth';

export async function POST(req: NextRequest) {
  if (!verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'))) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const workerId = typeof body.workerId === 'string' ? body.workerId : 'brain-worker';
  const userId = typeof body.userId === 'string' ? body.userId : null;
  const status = typeof body.status === 'string' ? body.status.slice(0, 40) : 'ONLINE';

  const supabase = createClient();
  const { error } = await supabase.from('brain_worker_heartbeats').upsert({
    worker_id: workerId,
    user_id: userId,
    status,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'worker_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, serverTime: new Date().toISOString() });
}
