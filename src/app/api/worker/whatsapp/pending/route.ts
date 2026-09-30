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
  const verified =
    verifyBrainWorkerSignature(
      req.headers.get('x-mentra-worker-timestamp'),
      req.headers.get('x-mentra-worker-signature'),
      ''
    ) ||
    verifyBrainWorkerToken(req.headers.get('x-mentra-worker-token')) ||
    verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'));

  if (!verified) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  try {
    return await runAsTrustedServer('brain_worker_pending_session', async () => {
      const supabase = createClient();

      // Check for an active or waiting QR session
      const { data: qrSession } = await supabase
        .from('whatsapp_qr_sessions')
        .select('user_id, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qrSession?.user_id) {
        return NextResponse.json({
          success: true,
          userId: qrSession.user_id,
          status: qrSession.status
        });
      }

      // Fallback: check recent whatsapp_connections
      const { data: conn } = await supabase
        .from('whatsapp_connections')
        .select('user_id, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        success: Boolean(conn?.user_id),
        userId: conn?.user_id || null,
        status: conn?.status || 'IDLE'
      });
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
