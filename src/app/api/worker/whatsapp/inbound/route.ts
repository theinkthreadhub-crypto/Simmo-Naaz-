import { NextRequest, NextResponse } from 'next/server';
import { runMentra } from '@/lib/ai/core';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken,
  verifySupabaseUserToken
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';
import { createClient } from '@/lib/supabase/server';
import { executeApprovalDecision } from '@/lib/approvals/executor';

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

  if (signedWorker || tokenWorker || legacyWorker) {
    userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;
  } else {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const user = await verifySupabaseUserToken(token);
    userId = user?.id || null;
  }

  if (!userId) {
    // Attempt automatic user discovery by sender phone number or recent session
    const senderNumber = typeof body.jid === 'string'
      ? body.jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
      : '';

    await runAsTrustedServer('resolve_inbound_whatsapp_user', async () => {
      const supabase = createClient();

      if (senderNumber) {
        const { data: matchedQr } = await supabase
          .from('whatsapp_qr_sessions')
          .select('user_id')
          .ilike('connected_number', `%${senderNumber}%`)
          .limit(1)
          .maybeSingle();

        if (matchedQr?.user_id) {
          userId = matchedQr.user_id;
          return;
        }

        const { data: matchedConn } = await supabase
          .from('whatsapp_connections')
          .select('user_id')
          .ilike('phone_number', `%${senderNumber}%`)
          .limit(1)
          .maybeSingle();

        if (matchedConn?.user_id) {
          userId = matchedConn.user_id;
          return;
        }
      }

      // Fallback: most recently updated QR session
      const { data: latestQr } = await supabase
        .from('whatsapp_qr_sessions')
        .select('user_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestQr?.user_id) {
        userId = latestQr.user_id;
        return;
      }

      // Fallback: most recent connection
      const { data: latestConn } = await supabase
        .from('whatsapp_connections')
        .select('user_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestConn?.user_id) {
        userId = latestConn.user_id;
        return;
      }

      // Fallback: profiles table
      const { data: latestProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestProfile?.user_id) {
        userId = latestProfile.user_id;
        return;
      }

      // Fallback: conversations table
      const { data: latestConv } = await supabase
        .from('conversations')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestConv?.user_id) {
        userId = latestConv.user_id;
      }
    });
  }

  const resolvedUserId = userId;
  if (!resolvedUserId) {
    return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 401 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const messageId =
    typeof body.messageId === 'string' ? body.messageId : `qr_${Date.now()}`;

  // Check if incoming message is a fashion design image from WhatsApp
  if (body.media?.base64) {
    const { processIncomingFashionDesign } = await import('@/lib/fashion/autonomousPipeline');
    const fashionResult = await processIncomingFashionDesign({
      userId: resolvedUserId,
      imageBase64: body.media.base64,
      mimeType: body.media.mimeType || 'image/jpeg',
      caption: body.media.caption || text,
      sourceJid: body.jid
    });

    return NextResponse.json({
      success: fashionResult.success,
      status: 'HANDLED',
      reply: fashionResult.message,
      cards: []
    });
  }

  if (!text) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  if (text === '1' || text === '3') {
    const approvalCommand = await runAsTrustedServer(
      'worker_whatsapp_fashion_approval',
      async () => {
        const supabase = createClient();
        const { data: pendingApproval, error } = await supabase
          .from('approval_requests')
          .select('id')
          .eq('user_id', resolvedUserId)
          .eq('tool_name', 'publishFashionProduct')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !pendingApproval?.id) {
          return null;
        }

        return executeApprovalDecision(
          resolvedUserId,
          pendingApproval.id,
          text === '1' ? 'APPROVE' : 'REJECT'
        );
      }
    );

    if (approvalCommand) {
      return NextResponse.json({
        success: approvalCommand.success,
        status: approvalCommand.status,
        reply: approvalCommand.message,
        cards: []
      });
    }
  }

  const execute = () =>
    runMentra({
      userId: resolvedUserId,
      channel: 'WHATSAPP',
      text,
      timestamp: new Date().toISOString(),
      externalMessageId: messageId
    });

  const isAuthorizedWorker = Boolean(signedWorker || tokenWorker || legacyWorker);
  const result = isAuthorizedWorker
    ? await runAsTrustedServer('worker_whatsapp_inbound', execute)
    : await execute();

  return NextResponse.json({
    success: result.success,
    status: result.status,
    reply: result.message,
    cards: result.cards
  });
}
