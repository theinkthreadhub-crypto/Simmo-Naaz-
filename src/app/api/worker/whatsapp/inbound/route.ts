import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import { MentraIncomingMessage } from '@/lib/ai/types';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken,
  verifyBrainWorkerServiceKey
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type InboundBody = {
  action?: 'ack';
  userId?: string;
  jid?: string;
  messageId?: string;
  text?: string;
  pushName?: string;
  media?: {
    base64?: string;
    mimeType?: string;
    caption?: string;
  } | null;
};

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
  const serviceKeyWorker = verifyBrainWorkerServiceKey(
    req.headers.get('x-mentra-service-key')
  );

  if (!signedWorker && !tokenWorker && !legacyWorker && !serviceKeyWorker) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  let body: InboundBody;
  try {
    body = JSON.parse(rawBody || '{}') as InboundBody;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const resolvedUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!resolvedUserId) {
    return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 400 });
  }

  const messageId = String(body.messageId || '').trim();
  if (!messageId) {
    return NextResponse.json({ error: 'MESSAGE_ID_REQUIRED' }, { status: 400 });
  }

  const execute = async () => {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    if (body.action === 'ack') {
      const { data: acknowledged, error } = await supabase
        .from('whatsapp_inbound_receipts')
        .update({
          delivered_at: nowIso,
          updated_at: nowIso
        })
        .eq('user_id', resolvedUserId)
        .eq('message_id', messageId)
        .select('message_id')
        .maybeSingle();

      if (error) throw error;
      if (!acknowledged) {
        return NextResponse.json({ error: 'RECEIPT_NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        status: 'ACKNOWLEDGED',
        messageId
      });
    }

    const text = String(body.text || body.media?.caption || '').trim();
    if (!text && !body.media?.base64) {
      return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
    }

    const { data: existingReceipt, error: receiptReadError } = await supabase
      .from('whatsapp_inbound_receipts')
      .select('status, reply, delivered_at, updated_at')
      .eq('user_id', resolvedUserId)
      .eq('message_id', messageId)
      .maybeSingle();

    if (receiptReadError) throw receiptReadError;

    if (existingReceipt?.status === 'DONE' && existingReceipt.reply) {
      return NextResponse.json({
        success: true,
        status: 'DONE',
        reply: existingReceipt.reply,
        duplicate: true,
        delivered: Boolean(existingReceipt.delivered_at)
      });
    }

    if (existingReceipt?.status === 'PROCESSING') {
      const ageMs = Date.now() - new Date(existingReceipt.updated_at).getTime();
      if (Number.isFinite(ageMs) && ageMs < 90_000) {
        return NextResponse.json({
          success: true,
          status: 'PROCESSING',
          duplicate: true,
          delivered: false,
          retryAfterMs: 1200
        });
      }
    }

    if (existingReceipt) {
      const { error: resetError } = await supabase
        .from('whatsapp_inbound_receipts')
        .update({
          status: 'PROCESSING',
          reply: null,
          delivered_at: null,
          last_error: null,
          updated_at: nowIso
        })
        .eq('user_id', resolvedUserId)
        .eq('message_id', messageId);
      if (resetError) throw resetError;
    } else {
      const { error: insertError } = await supabase
        .from('whatsapp_inbound_receipts')
        .insert({
          user_id: resolvedUserId,
          message_id: messageId,
          status: 'PROCESSING',
          reply: null,
          delivered_at: null,
          last_error: null,
          received_at: nowIso,
          updated_at: nowIso
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({
            success: true,
            status: 'PROCESSING',
            duplicate: true,
            delivered: false,
            retryAfterMs: 1200
          });
        }
        throw insertError;
      }
    }

    try {
      const incoming: MentraIncomingMessage = {
        userId: resolvedUserId,
        channel: 'WHATSAPP',
        externalMessageId: messageId,
        text: body.media?.base64
          ? `${text || '[Image received]'}\n\n[Image attached: ${body.media.mimeType || 'image/jpeg'}; base64 payload available to the worker bridge]`
          : text,
        timestamp: new Date().toISOString()
      };

      const result = await runMentra(incoming);
      const reply =
        result.success && result.message
          ? String(result.message)
          : null;

      if (!reply) {
        const errorMessage = String(result.error || 'MENTRA_NO_REPLY').slice(0, 1000);
        await supabase
          .from('whatsapp_inbound_receipts')
          .update({
            status: 'FAILED',
            last_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', resolvedUserId)
          .eq('message_id', messageId);

        return NextResponse.json(
          { success: false, error: result.error || 'MENTRA_NO_REPLY' },
          { status: 502 }
        );
      }

      const { error: doneError } = await supabase
        .from('whatsapp_inbound_receipts')
        .update({
          status: 'DONE',
          reply,
          last_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', resolvedUserId)
        .eq('message_id', messageId);

      if (doneError) throw doneError;

      return NextResponse.json({
        success: true,
        status: 'DONE',
        reply,
        duplicate: false,
        delivered: false,
        conversationId: result.conversationId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await supabase
        .from('whatsapp_inbound_receipts')
        .update({
          status: 'FAILED',
          last_error: errorMessage.slice(0, 1000),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', resolvedUserId)
        .eq('message_id', messageId);
      throw error;
    }
  };

  try {
    return await runAsTrustedServer('brain_worker_whatsapp_inbound', execute);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[WhatsAppWorkerInbound]', message);
    return NextResponse.json({ error: 'INBOUND_PROCESSING_FAILED' }, { status: 500 });
  }
}
