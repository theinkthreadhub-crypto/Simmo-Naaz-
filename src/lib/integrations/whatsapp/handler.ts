import { createClient } from '@/lib/supabase/server';
import { resolveUserByPhone, linkUserByCode } from './linking';
import { whatsappClient } from './client';
import { runMentra } from '@/lib/ai/core';
import { MentraIncomingMessage } from '@/lib/ai/types';
import { completeUserQuest } from '@/lib/db/quests';
import { updateUserNotificationSettings } from '@/lib/notifications/preferences';
import { speechProvider } from '@/lib/speech/speechProvider';

export interface WhatsAppInboundPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
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
          audio?: {
            id: string;
            mime_type: string;
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Main Webhook Processing Pipeline
 */
export async function processWhatsAppInboundWebhook(payload: WhatsAppInboundPayload): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processedCount = 0;

  if (payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return { processed: 0, errors: ['Invalid payload object'] };
  }

  const supabase = createClient();

  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages || [];
      for (const msg of messages) {
        const fromPhone = msg.from;
        const externalMsgId = msg.id;

        // 1. Idempotency check: prevent duplicate execution
        const { data: existingInbound } = await supabase
          .from('inbound_messages')
          .select('id')
          .eq('provider_message_id', externalMsgId)
          .single();

        if (existingInbound) {
          console.log(`[WhatsAppWebhook] Duplicate message ${externalMsgId} ignored.`);
          continue;
        }

        // 2. Extract Message Text / Intent
        let incomingText = '';
        if (msg.type === 'text' && msg.text?.body) {
          incomingText = msg.text.body.trim();
        } else if (msg.type === 'interactive' && msg.interactive?.button_reply) {
          incomingText = msg.interactive.button_reply.id;
        } else if (msg.type === 'audio') {
          // Voice note foundation
          incomingText = '[VOICE_NOTE_RECEIVED]';
        }

        // 3. Log Inbound Message
        await supabase.from('inbound_messages').insert({
          channel: 'WHATSAPP',
          sender: fromPhone,
          provider_message_id: externalMsgId,
          message_type: msg.type.toUpperCase(),
          raw_payload: msg,
          created_at: new Date().toISOString()
        });

        // 4. Resolve User Identity
        let userId = await resolveUserByPhone(fromPhone);

        // 5. Handle Unlinked User / Linking Codes
        if (!userId) {
          const cleanCodeMatch = incomingText.replace(/[^0-9]/g, '');
          if (cleanCodeMatch.length === 6) {
            const linkRes = await linkUserByCode(fromPhone, cleanCodeMatch);
            if (linkRes.success && linkRes.userId) {
              await whatsappClient.sendTextMessage(
                fromPhone,
                `⚡ *MENTRA ONLINE*\n\nYour WhatsApp has been verified and securely linked to your MENTRA Sovereign Intelligence session.\n\nType *"Aaj kya karna hai?"* or *"Mera status"* to begin.`
              );
              processedCount++;
              continue;
            } else {
              await whatsappClient.sendTextMessage(
                fromPhone,
                `⚠️ ${linkRes.message}`
              );
              processedCount++;
              continue;
            }
          } else {
            await whatsappClient.sendTextMessage(
              fromPhone,
              `🔒 *MENTRA SOVEREIGN INTELLIGENCE*\n\nThis phone number is not linked to any active MENTRA account.\n\nTo link:\n1. Open your MENTRA Web App\n2. Navigate to *Settings > Connections > WhatsApp*\n3. Click *Connect* to generate your 6-digit link code\n4. Reply here with that 6-digit code.`
            );
            processedCount++;
            continue;
          }
        }

        // 6. Linked User - Handle Quick Shortcuts
        const upperText = incomingText.toUpperCase();

        // 6a. DND / Pause Notifications Shortcut
        if (upperText === 'DND' || upperText === 'PAUSE' || upperText.includes('DISTURB MAT KARNA')) {
          const pauseUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await updateUserNotificationSettings(userId, { paused_until: pauseUntil });
          await whatsappClient.sendTextMessage(
            fromPhone,
            `🌙 *DO NOT DISTURB ACTIVATED*\n\nRoutine proactive MENTRA notifications paused for 24 hours.\nYou can still message me anytime.`,
            userId
          );
          processedCount++;
          continue;
        }

        // 6b. Quest Shortcut (e.g. "1 done", "2 done")
        const questDoneMatch = upperText.match(/^([1-3])\s*(DONE|COMPLETED?|HO GAYA|HO GYA)$/i);
        if (questDoneMatch) {
          const questIndex = parseInt(questDoneMatch[1], 10) - 1;
          const { data: activeQuests } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'IN_PROGRESS')
            .order('created_at', { ascending: false })
            .limit(3);

          if (activeQuests && activeQuests[questIndex]) {
            const targetQuest = activeQuests[questIndex];
            const success = await completeUserQuest(userId, targetQuest.id);
            if (success) {
              await whatsappClient.sendTextMessage(
                fromPhone,
                `⚔️ *QUEST COMPLETE!*\n\n*${targetQuest.title}*\n+${targetQuest.xp_reward} XP Awarded 🌟\n\n_Keep dominating your sovereign trajectory._`,
                userId
              );
              processedCount++;
              continue;
            }
          }
        }

        // 6c. Approval Shortcut (e.g. "APPROVE <id>" or "REJECT <id>")
        if (upperText.startsWith('APPROVE') || upperText.startsWith('REJECT')) {
          const parts = upperText.split('_').length > 1 ? upperText.split('_') : upperText.split(' ');
          const decision = parts[0] === 'APPROVE' ? 'APPROVE' : 'REJECT';
          const approvalId = parts[1];

          if (approvalId) {
            const { data: appReq } = await supabase
              .from('approval_requests')
              .select('*')
              .eq('id', approvalId)
              .eq('user_id', userId)
              .single();

            if (appReq && appReq.status === 'PENDING') {
              await supabase
                .from('approval_requests')
                .update({ status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', updated_at: new Date().toISOString() })
                .eq('id', approvalId);

              await whatsappClient.sendTextMessage(
                fromPhone,
                `⚖️ *ACTION ${decision}D*\n\nRequest: ${appReq.action_description || appReq.tool_name}\nStatus: ${decision}D`,
                userId
              );
              processedCount++;
              continue;
            }
          }
        }

        // 6d. Voice Note Audio Processing Foundation
        if (msg.type === 'audio' && msg.audio?.id) {
          if (speechProvider.isAvailable()) {
            await whatsappClient.sendTextMessage(
              fromPhone,
              `🎙️ *VOICE NOTE RECEIVED*\n\nTranscribing sovereign speech note...`,
              userId
            );
          } else {
            await whatsappClient.sendTextMessage(
              fromPhone,
              `🎙️ *VOICE NOTE RECEIVED*\n\nVoice transcription provider is not configured. Text commands are fully active.`,
              userId
            );
          }
          incomingText = 'User sent a voice note. Provide audio speech feedback or journal transcription.';
        }

        // 7. Route through MENTRA Sovereign AI Core
        const incomingMessage: MentraIncomingMessage = {
          userId,
          channel: 'WHATSAPP',
          externalMessageId: externalMsgId,
          text: incomingText,
          timestamp: new Date().toISOString()
        };

        const result = await runMentra(incomingMessage);

        if (result.success && result.message) {
          // Send formatted concise reply back to WhatsApp
          await whatsappClient.sendTextMessage(fromPhone, result.message, userId);
        } else if (result.error) {
          await whatsappClient.sendTextMessage(fromPhone, `⚠️ ${result.error}`, userId);
        }

        processedCount++;
      }
    }
  }

  return { processed: processedCount, errors };
}
