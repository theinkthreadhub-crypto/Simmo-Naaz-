import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken,
  verifySupabaseUserToken
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

  const body = (() => {
    try {
      return JSON.parse(rawBody || '{}');
    } catch {
      return {};
    }
  })();

  let userId: string | null = null;

  if (signedWorker) {
    userId = typeof body.userId === 'string' ? body.userId : null;
  } else {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const user = await verifySupabaseUserToken(token);
    userId = user?.id || null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 401 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const messageId =
    typeof body.messageId === 'string' ? body.messageId : `qr_${Date.now()}`;

  if (!text) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  const execute = () =>
    runMentra({
      userId,
      channel: 'WHATSAPP',
      text,
      timestamp: new Date().toISOString(),
      externalMessageId: messageId
    });

  const result = signedWorker
    ? await runAsTrustedServer('signed_brain_worker_whatsapp', execute)
    : await execute();

  return NextResponse.json({
    success: result.success,
    status: result.status,
    reply: result.message,
    cards: result.cards
  });
}
