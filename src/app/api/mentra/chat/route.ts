import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Authenticated user session check
    let userId = user?.id;
    if (!userId) {
      // In local demo mode, fallback to demo operator id
      userId = 'usr_operator_naaz';
    }

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
    console.error('[MENTRA CHAT API ERR]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
