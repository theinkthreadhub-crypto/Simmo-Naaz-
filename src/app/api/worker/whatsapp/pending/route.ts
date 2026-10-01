import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rawBody = req.method === 'POST' ? await req.text() : '';
  let body: { userId?: string; connectedNumber?: string; workerId?: string } = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  const verified =
    verifyBrainWorkerSignature(
      req.headers.get('x-mentra-worker-timestamp'),
      req.headers.get('x-mentra-worker-signature'),
      rawBody
    ) ||
    verifyBrainWorkerToken(req.headers.get('x-mentra-worker-token')) ||
    verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'));

  if (!verified) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  try {
    return await runAsTrustedServer('brain_worker_pending_session', async () => {
      const supabase = createClient();

      if (body.userId) {
        const { data, error } = await supabase.from('whatsapp_qr_sessions')
          .select('user_id,status').eq('user_id', body.userId).maybeSingle();
        if (error) throw error;
        return NextResponse.json({ success: Boolean(data), userId: data?.user_id || null, status: data?.status || 'IDLE' });
      }

      // Check for an active or waiting QR session
      const { data: sessions, error: pendingError } = await supabase
        .from('whatsapp_qr_sessions')
        .select('user_id, status, updated_at')
        .eq('status', 'WAITING_QR')
        .eq('worker_id', body.workerId || 'mentra-brain-01')
        .order('updated_at', { ascending: false })
        .limit(2);
      if (pendingError) throw pendingError;
      const qrSession = sessions?.length === 1 ? sessions[0] : null;

      if (qrSession?.user_id) {
        return NextResponse.json({
          success: true,
          userId: qrSession.user_id,
          status: qrSession.status
        });
      }

      return NextResponse.json({ success: false, userId: null, status: 'IDLE' });
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
