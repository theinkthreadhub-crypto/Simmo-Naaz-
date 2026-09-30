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

      let connectedNumber = '';
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          connectedNumber = typeof body?.connectedNumber === 'string' ? body.connectedNumber.replace(/[^0-9]/g, '') : '';
        } catch {}
      }

      if (connectedNumber) {
        const { data: matchedQr } = await supabase
          .from('whatsapp_qr_sessions')
          .select('user_id, status')
          .ilike('connected_number', `%${connectedNumber}%`)
          .limit(1)
          .maybeSingle();
        if (matchedQr?.user_id) {
          return NextResponse.json({
            success: true,
            userId: matchedQr.user_id,
            status: matchedQr.status
          });
        }
      }

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

      if (conn?.user_id) {
        return NextResponse.json({
          success: true,
          userId: conn.user_id,
          status: conn.status || 'IDLE'
        });
      }

      // Fallback: check profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profile?.user_id) {
        return NextResponse.json({
          success: true,
          userId: profile.user_id,
          status: 'IDLE'
        });
      }

      // Fallback: check conversations
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        success: Boolean(conv?.user_id),
        userId: conv?.user_id || null,
        status: 'IDLE'
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
