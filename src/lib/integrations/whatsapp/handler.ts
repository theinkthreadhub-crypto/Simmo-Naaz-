import { createClient } from '@/lib/supabase/server';
import {
  resolveUserByPhone,
  linkUserByCode,
  touchWhatsAppConnection
} from './linking';
import { whatsappClient } from './client';
import { runMentra } from '@/lib/ai/core';
import { MentraIncomingMessage } from '@/lib/ai/types';
import { completeUserQuest } from '@/lib/db/quests';
import { updateUserNotificationSettings } from '@/lib/notifications/preferences';
import { executeApprovalDecision } from '@/lib/approvals/executor';

export interface WhatsAppInboundPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          profile?: { name?: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'interactive' | 'audio' | 'image' | 'button' | string;
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
          };
          button?: {
            payload?: string;
            text?: string;
          };
          audio?: {
            id: string;
            mime_type?: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed' | string;
          timestamp?: string;
          recipient_id?: string;
          errors?: Array<{
            code?: number;
            title?: string;
            message?: string;
            error_data?: { details?: string };
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

type InboundStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'IGNORED'
  | 'DUPLICATE';

interface ClaimedInbound {
  id: string;
  isDuplicate: boolean;
}

function extractIncomingText(msg: any): string {
  if (msg.type === 'text' && msg.text?.body) {
    return msg.text.body.trim();
  }

  if (msg.type === 'interactive' && msg.interactive?.button_reply?.id) {
    return msg.interactive.button_reply.id.trim();
  }

  if (msg.type === 'button') {
    return String(msg.button?.payload || msg.button?.text || '').trim();
  }

  return '';
}

async function claimInboundMessage(
  providerMessageId: string,
  senderPhone: string,
  messageType: string,
  text: string
): Promise<ClaimedInbound | null> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from('inbound_messages')
    .insert({
      user_id: null,
      channel: 'WHATSAPP',
      provider_message_id: providerMessageId,
      sender_phone: senderPhone,
      message_type: messageType.toUpperCase(),
      text: text || null,
      status: 'RECEIVED',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .maybeSingle();

  if (!insertError && inserted?.id) {
    const { data: claimed } = await supabase
      .from('inbound_messages')
      .update({ status: 'PROCESSING', updated_at: now })
      .eq('id', inserted.id)
      .eq('status', 'RECEIVED')
      .select('id')
      .maybeSingle();

    return claimed?.id ? { id: claimed.id, isDuplicate: false } : null;
  }

  if (insertError?.code !== '23505') {
    throw new Error(insertError?.message || 'WHATSAPP_INBOUND_INSERT_FAILED');
  }

  const { data: existing, error: existingError } = await supabase
    .from('inbound_messages')
    .select('id, status, updated_at')
    .eq('provider_message_id', providerMessageId)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(existingError?.message || 'WHATSAPP_INBOUND_LOOKUP_FAILED');
  }

  if (existing.status === 'PROCESSED' || existing.status === 'IGNORED') {
    return { id: existing.id, isDuplicate: true };
  }

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  if (existing.status === 'FAILED' || existing.status === 'RECEIVED') {
    const { data: reclaimed } = await supabase
      .from('inbound_messages')
      .update({ status: 'PROCESSING', updated_at: now })
      .eq('id', existing.id)
      .in('status', ['FAILED', 'RECEIVED'])
      .select('id')
      .maybeSingle();

    return reclaimed?.id
      ? { id: reclaimed.id, isDuplicate: false }
      : { id: existing.id, isDuplicate: true };
  }

  if (
    existing.status === 'PROCESSING' &&
    existing.updated_at &&
    existing.updated_at <= staleBefore
  ) {
    const { data: reclaimed } = await supabase
      .from('inbound_messages')
      .update({ status: 'PROCESSING', updated_at: now })
      .eq('id', existing.id)
      .eq('status', 'PROCESSING')
      .lte('updated_at', staleBefore)
      .select('id')
      .maybeSingle();

    return reclaimed?.id
      ? { id: reclaimed.id, isDuplicate: false }
      : { id: existing.id, isDuplicate: true };
  }

  return { id: existing.id, isDuplicate: true };
}

async function finalizeInbound(
  inboundId: string,
  status: InboundStatus,
  userId?: string | null
): Promise<void> {
  const supabase = createClient();
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (userId) update.user_id = userId;

  await supabase
    .from('inbound_messages')
    .update(update)
    .eq('id', inboundId);
}

async function processDeliveryStatuses(payload: WhatsAppInboundPayload): Promise<void> {
  const supabase = createClient();

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const delivery of change.value?.statuses || []) {
        const mapped =
          delivery.status === 'sent'
            ? 'SENT'
            : delivery.status === 'delivered'
              ? 'DELIVERED'
              : delivery.status === 'read'
                ? 'READ'
                : delivery.status === 'failed'
                  ? 'FAILED'
                  : null;

        if (!mapped) continue;

        const errorText = delivery.errors?.length
          ? delivery.errors
              .map(error =>
                error.error_data?.details ||
                error.message ||
                error.title ||
                String(error.code || 'WhatsApp delivery failure')
              )
              .join('; ')
              .slice(0, 1500)
          : null;

        await supabase
          .from('outbound_messages')
          .update({
            status: mapped,
            error: mapped === 'FAILED' ? errorText : null,
            updated_at: new Date().toISOString()
          })
          .eq('provider_message_id', delivery.id);
      }
    }
  }
}

export async function processWhatsAppInboundWebhook(
  payload: WhatsAppInboundPayload
): Promise<{ processed: number; duplicates: number; errors: string[] }> {
  const errors: string[] = [];
  let processedCount = 0;
  let duplicateCount = 0;

  if (payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return {
      processed: 0,
      duplicates: 0,
      errors: ['INVALID_WHATSAPP_PAYLOAD']
    };
  }

  await processDeliveryStatuses(payload);

  const supabase = createClient();

  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      for (const msg of change.value?.messages || []) {
        const fromPhone = String(msg.from || '').replace(/[^0-9]/g, '');
        const externalMsgId = msg.id;
        const incomingText = extractIncomingText(msg);

        let claim: ClaimedInbound | null = null;

        try {
          claim = await claimInboundMessage(
            externalMsgId,
            fromPhone,
            msg.type,
            incomingText
          );

          if (!claim) continue;
          if (claim.isDuplicate) {
            duplicateCount++;
            continue;
          }

          let userId = await resolveUserByPhone(fromPhone);

          if (!userId) {
            const cleanCode = incomingText.replace(/[^0-9]/g, '');

            if (/^[0-9]{6}$/.test(cleanCode)) {
              const linkResult = await linkUserByCode(fromPhone, cleanCode);

              if (linkResult.success && linkResult.userId) {
                userId = linkResult.userId;
                await finalizeInbound(claim.id, 'PROCESSED', userId);

                await whatsappClient.sendTextMessage(
                  fromPhone,
                  'MENTRA ONLINE\n\nYour WhatsApp is securely linked. Send a normal message to use MENTRA from WhatsApp.',
                  userId,
                  `wa:${externalMsgId}:link-success`
                );

                processedCount++;
                continue;
              }

              await whatsappClient.sendTextMessage(
                fromPhone,
                `MENTRA LINK FAILED\n\n${linkResult.message}`
              );
              await finalizeInbound(claim.id, 'PROCESSED');
              processedCount++;
              continue;
            }

            await whatsappClient.sendTextMessage(
              fromPhone,
              'MENTRA is not linked to this number. Open MENTRA > Connections > WhatsApp, generate a 6-digit code, then send that code here.'
            );

            await finalizeInbound(claim.id, 'PROCESSED');
            processedCount++;
            continue;
          }

          await touchWhatsAppConnection(userId, fromPhone);
          await supabase
            .from('inbound_messages')
            .update({ user_id: userId, updated_at: new Date().toISOString() })
            .eq('id', claim.id);

          const upperText = incomingText.toUpperCase();

          if (
            upperText === 'DND' ||
            upperText === 'PAUSE' ||
            upperText.includes('DISTURB MAT KARNA')
          ) {
            const pauseUntil = new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString();

            const updated = await updateUserNotificationSettings(userId, {
              paused_until: pauseUntil
            });

            await whatsappClient.sendTextMessage(
              fromPhone,
              updated
                ? 'Do Not Disturb enabled for 24 hours. You can still message MENTRA anytime.'
                : 'I could not update notification settings. Please try again.',
              userId,
              `wa:${externalMsgId}:dnd`
            );

            await finalizeInbound(
              claim.id,
              updated ? 'PROCESSED' : 'FAILED',
              userId
            );
            processedCount++;
            continue;
          }

          const questDoneMatch = upperText.match(
            /^([1-3])\s*(DONE|COMPLETED?|HO GAYA|HO GYA)$/i
          );

          if (questDoneMatch) {
            const questIndex = parseInt(questDoneMatch[1], 10) - 1;
            const { data: activeQuests, error: questError } = await supabase
              .from('quests')
              .select('id, title, xp_reward')
              .eq('user_id', userId)
              .eq('status', 'ACTIVE')
              .order('created_at', { ascending: false })
              .limit(3);

            if (questError) throw new Error(questError.message);

            const targetQuest = activeQuests?.[questIndex];

            if (!targetQuest) {
              await whatsappClient.sendTextMessage(
                fromPhone,
                'That quest number is not currently active. Ask MENTRA for your active quests.',
                userId,
                `wa:${externalMsgId}:quest-not-found`
              );
            } else {
              const success = await completeUserQuest(userId, targetQuest.id);

              await whatsappClient.sendTextMessage(
                fromPhone,
                success
                  ? `Quest complete: ${targetQuest.title}. +${targetQuest.xp_reward || 0} XP.`
                  : 'That quest could not be completed or was already completed.',
                userId,
                `wa:${externalMsgId}:quest-complete`
              );
            }

            await finalizeInbound(claim.id, 'PROCESSED', userId);
            processedCount++;
            continue;
          }

          if (
            upperText.startsWith('APPROVE') ||
            upperText.startsWith('REJECT')
          ) {
            const rawParts = incomingText.trim().split(/[\s_]+/);
            const decision =
              rawParts[0].toUpperCase() === 'APPROVE'
                ? 'APPROVE'
                : 'REJECT';
            const approvalId = rawParts.slice(1).join('').trim();

            if (!approvalId) {
              await whatsappClient.sendTextMessage(
                fromPhone,
                'Approval ID is missing. Use APPROVE <id> or REJECT <id>.',
                userId,
                `wa:${externalMsgId}:approval-missing`
              );
              await finalizeInbound(claim.id, 'PROCESSED', userId);
              processedCount++;
              continue;
            }

            const approvalResult = await executeApprovalDecision(
              userId,
              approvalId,
              decision
            );

            await whatsappClient.sendTextMessage(
              fromPhone,
              `${approvalResult.status}: ${approvalResult.message}`,
              userId,
              `wa:${externalMsgId}:approval`
            );

            await finalizeInbound(claim.id, 'PROCESSED', userId);
            processedCount++;
            continue;
          }

          if (msg.type === 'audio') {
            await whatsappClient.sendTextMessage(
              fromPhone,
              'Voice note received, but voice transcription is not active yet. Please send the command as text for now.',
              userId,
              `wa:${externalMsgId}:voice-unavailable`
            );

            await finalizeInbound(claim.id, 'PROCESSED', userId);
            processedCount++;
            continue;
          }

          if (!incomingText) {
            await whatsappClient.sendTextMessage(
              fromPhone,
              'This message type is not supported yet. Please send text.',
              userId,
              `wa:${externalMsgId}:unsupported`
            );

            await finalizeInbound(claim.id, 'PROCESSED', userId);
            processedCount++;
            continue;
          }

          const incomingMessage: MentraIncomingMessage = {
            userId,
            channel: 'WHATSAPP',
            externalMessageId: externalMsgId,
            text: incomingText,
            timestamp: new Date().toISOString()
          };

          const result = await runMentra(incomingMessage);

          const reply =
            result.message ||
            result.error ||
            'MENTRA could not produce a response for this message.';

          await whatsappClient.sendTextMessage(
            fromPhone,
            reply.slice(0, 4096),
            userId,
            `wa:${externalMsgId}:ai-reply`
          );

          await finalizeInbound(claim.id, 'PROCESSED', userId);
          processedCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${externalMsgId}: ${message}`);

          if (claim?.id && !claim.isDuplicate) {
            await finalizeInbound(claim.id, 'FAILED').catch(() => undefined);
          }
        }
      }
    }
  }

  return {
    processed: processedCount,
    duplicates: duplicateCount,
    errors
  };
}
