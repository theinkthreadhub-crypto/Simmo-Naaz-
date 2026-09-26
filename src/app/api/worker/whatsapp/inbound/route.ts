import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import {
  verifyBrainWorkerSecret,
  verifySupabaseUserToken
} from '@/lib/worker/auth';

export async function POST(req: NextRequest) {
  if (!verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'))) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const user = await verifySupabaseUserToken(token);
  if (!user) {
    return NextResponse.json({ error: 'USER_TOKEN_REQUIRED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const messageId =
    typeof body.messageId === 'string' ? body.messageId : `qr_${Date.now()}`;

  if (!text) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  const result = await runMentra({
    userId: user.id,
    channel: 'WHATSAPP',
    text,
    timestamp: new Date().toISOString(),
    externalMessageId: messageId
  });

  return NextResponse.json({
    success: result.success,
    status: result.status,
    reply: result.message,
    cards: result.cards
  });
}
