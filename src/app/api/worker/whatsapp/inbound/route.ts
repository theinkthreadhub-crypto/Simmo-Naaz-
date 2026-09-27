import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifySupabaseUserToken
} from '@/lib/worker/auth';

function phoneFromJid(jid: string): string {
  return String(jid || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/[^0-9]/g, '');
}

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
    typeof body.messageId === 'string' && body.messageId.trim()
      ? body.messageId.trim()
      : '';
  const jid = typeof body.jid === 'string' ? body.jid : '';

  if (!text) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  if (!messageId) {
    return NextResponse.json({ error: 'MESSAGE_ID_REQUIRED' }, { status: 400 });
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from('inbound_messages')
    .insert({
      user_id: user.id,
      channel: 'WHATSAPP',
      provider_message_id: messageId,
      sender_phone: phoneFromJid(jid) || 'SELF',
      message_type: 'TEXT',
      text,
      status: 'PROCESSING',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .maybeSingle();

  if (insertError?.code === '23505') {
    return NextResponse.json({
      success: true,
      duplicate: true,
      reply: null
    });
  }

  if (insertError || !inserted?.id) {
    return NextResponse.json(
      {
        success: false,
        error: insertError?.message || 'INBOUND_LEDGER_WRITE_FAILED'
      },
      { status: 500 }
    );
  }

  try {
    const result = await runMentra({
      userId: user.id,
      channel: 'WHATSAPP',
      text,
      timestamp: now,
      externalMessageId: messageId
    });

    await supabase
      .from('inbound_messages')
      .update({
        status: result.success ? 'PROCESSED' : 'FAILED',
        updated_at: new Date().toISOString()
      })
      .eq('id', inserted.id);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      reply: result.message,
      cards: result.cards,
      error: result.error
    });
  } catch (error) {
    await supabase
      .from('inbound_messages')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString()
      })
      .eq('id', inserted.id);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
