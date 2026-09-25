import { NextResponse } from 'next/server';
import { requireUser, AuthRequiredError } from '@/lib/auth/requireUser';
import { runMentra } from '@/lib/ai/core';

export async function POST(request: Request) {
  try {
    // 1. Enforce strict authentic user session
    const user = await requireUser();
    const userId = user.id;

    const body = await request.json();
    const { message, conversationId, channel, pageContext, externalMessageId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const result = await runMentra({
      userId,
      text: message.trim(),
      channel: channel || 'WEB',
      timestamp: new Date().toISOString(),
      conversationId,
      pageContext,
      externalMessageId
    });

    return NextResponse.json(result);

  } catch (err: any) {
    if (err instanceof AuthRequiredError || err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    console.error('[MENTRA CHAT API ERR]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
