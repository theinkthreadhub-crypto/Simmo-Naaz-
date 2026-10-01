import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken,
  verifyBrainWorkerServiceKey
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';
import { createClient } from '@/lib/supabase/server';
import { executeApprovalDecision } from '@/lib/approvals/executor';

export const maxDuration = 120;

const RECEIPT_STALE_MS = 2 * 60 * 1000;

type ReceiptClaim =
  | { state: 'CLAIMED' }
  | { state: 'PROCESSING' }
  | { state: 'DONE'; reply: string; delivered: boolean };

async function readReceipt(userId: string, messageId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('whatsapp_inbound_receipts')
    .select('status, reply, delivered_at, updated_at')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function claimReceipt(userId: string, messageId: string): Promise<ReceiptClaim> {
  return runAsTrustedServer('worker_whatsapp_receipt_claim', async () => {
    const supabase = createClient();
    const existing = await readReceipt(userId, messageId);

    if (existing?.status === 'DONE' && existing.reply) {
      return { state: 'DONE', reply: existing.reply, delivered: Boolean(existing.delivered_at) };
    }

    if (
      existing?.status === 'PROCESSING' &&
      existing.updated_at &&
      Date.now() - new Date(existing.updated_at).getTime() < RECEIPT_STALE_MS
    ) {
      return { state: 'PROCESSING' };
    }

    if (existing) {
      const { error } = await supabase
        .from('whatsapp_inbound_receipts')
        .update({ status: 'PROCESSING', reply: null, delivered_at: null, last_error: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('message_id', messageId);
      if (error) throw error;
      return { state: 'CLAIMED' };
    }

    const { error: insertError } = await supabase
      .from('whatsapp_inbound_receipts')
      .insert({ user_id: userId, message_id: messageId, status: 'PROCESSING', updated_at: new Date().toISOString() });

    if (!insertError) return { state: 'CLAIMED' };
    if (insertError.code !== '23505') throw insertError;

    const raced = await readReceipt(userId, messageId);
    if (raced?.status === 'DONE' && raced.reply) {
      return { state: 'DONE', reply: raced.reply, delivered: Boolean(raced.delivered_at) };
    }
    return { state: 'PROCESSING' };
  });
}

async function completeReceipt(userId: string, messageId: string, reply: string) {
  await runAsTrustedServer('worker_whatsapp_receipt_complete', async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('whatsapp_inbound_receipts')
      .update({ status: 'DONE', reply, last_error: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('message_id', messageId);
    if (error) throw error;
  });
}

async function failReceipt(userId: string, messageId: string, errorMessage: string) {
  await runAsTrustedServer('worker_whatsapp_receipt_fail', async () => {
    const supabase = createClient();
    await supabase
      .from('whatsapp_inbound_receipts')
      .update({ status: 'FAILED', last_error: errorMessage.slice(0, 1000), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('message_id', messageId);
  }).catch(() => {});
}

async function acknowledgeDelivery(userId: string, messageId: string) {
  await runAsTrustedServer('worker_whatsapp_receipt_ack', async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('whatsapp_inbound_receipts')
      .update({ delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('message_id', messageId);
    if (error) throw error;
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signedWorker = verifyBrainWorkerSignature(req.headers.get('x-mentra-worker-timestamp'), req.headers.get('x-mentra-worker-signature'), rawBody);
  const tokenWorker = verifyBrainWorkerToken(req.headers.get('x-mentra-worker-token'));
  const legacyWorker = verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret'));
  const serviceKeyWorker = verifyBrainWorkerServiceKey(req.headers.get('x-mentra-service-key'));

  if (!signedWorker && !tokenWorker && !legacyWorker && !serviceKeyWorker) {
    return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });
  }

  const body = (() => {
    try { return JSON.parse(rawBody || '{}'); } catch { return {}; }
  })();

  const userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;
  if (!userId) return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 401 });

  const messageId = typeof body.messageId === 'string' && body.messageId.trim() ? body.messageId.trim() : null;

  if (body.action === 'ack') {
    if (!messageId) return NextResponse.json({ error: 'MESSAGE_ID_REQUIRED' }, { status: 400 });
    await acknowledgeDelivery(userId, messageId);
    return NextResponse.json({ success: true, status: 'DELIVERED' });
  }

  if (!messageId) return NextResponse.json({ error: 'MESSAGE_ID_REQUIRED' }, { status: 400 });

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text && !body.media?.base64) return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });

  const receipt = await claimReceipt(userId, messageId);
  if (receipt.state === 'DONE') {
    return NextResponse.json({ success: true, status: 'DUPLICATE', reply: receipt.reply, cards: [], duplicate: true, delivered: receipt.delivered });
  }
  if (receipt.state === 'PROCESSING') {
    return NextResponse.json({ success: false, status: 'PROCESSING', retryAfterMs: 1000 }, { status: 202 });
  }

  try {
    if (body.media?.base64) {
      const { processIncomingFashionDesign } = await import('@/lib/fashion/autonomousPipeline');
      const fashionResult = await runAsTrustedServer('worker_whatsapp_media', () => processIncomingFashionDesign({
        userId,
        imageBase64: body.media.base64,
        mimeType: body.media.mimeType || 'image/jpeg',
        caption: body.media.caption || text,
        sourceJid: body.jid
      }));
      const reply = fashionResult.message || 'Image received.';
      await completeReceipt(userId, messageId, reply);
      return NextResponse.json({ success: fashionResult.success, status: 'HANDLED', reply, cards: [] });
    }

    if (text === '1' || text === '3') {
      const approvalCommand = await runAsTrustedServer('worker_whatsapp_fashion_approval', async () => {
        const supabase = createClient();
        const { data: pendingApproval, error } = await supabase
          .from('approval_requests')
          .select('id')
          .eq('user_id', userId)
          .eq('tool_name', 'publishFashionProduct')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || !pendingApproval?.id) return null;
        return executeApprovalDecision(userId, pendingApproval.id, text === '1' ? 'APPROVE' : 'REJECT');
      });

      if (approvalCommand) {
        const reply = approvalCommand.message || 'Approval updated.';
        await completeReceipt(userId, messageId, reply);
        return NextResponse.json({ success: approvalCommand.success, status: approvalCommand.status, reply, cards: [] });
      }
    }

    const execute = async () => {
      const supabase = createClient();
      const { data: existing, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('channel', 'WHATSAPP')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (conversationError) throw new Error('WHATSAPP_CONVERSATION_LOOKUP_FAILED');

      return runMentra({
        userId,
        channel: 'WHATSAPP',
        conversationId: existing?.id,
        text,
        timestamp: new Date().toISOString(),
        externalMessageId: messageId
      });
    };

    const isAuthorizedWorker = Boolean(signedWorker || tokenWorker || legacyWorker || serviceKeyWorker);
    const result = isAuthorizedWorker
      ? await runAsTrustedServer('worker_whatsapp_inbound', execute)
      : await execute();

    const reply = result.message || 'Command processed.';
    await completeReceipt(userId, messageId, reply);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      reply,
      cards: result.cards,
      duplicate: false,
      delivered: false
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await failReceipt(userId, messageId, errorMessage);
    console.error('[WhatsApp inbound route]', error);
    return NextResponse.json({ error: 'WHATSAPP_INBOUND_FAILED' }, { status: 503 });
  }
}
