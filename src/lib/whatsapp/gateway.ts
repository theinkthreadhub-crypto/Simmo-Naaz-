import { runMentra } from '@/lib/ai/core';
import { whatsappClient } from '@/lib/integrations/whatsapp/client';
import {
  verifyWebhookChallenge,
  verifyWebhookSignature
} from '@/lib/integrations/whatsapp/security';

export interface WhatsAppInboundMessage {
  from: string;
  messageId: string;
  type: 'text' | 'audio' | 'document';
  text?: string;
  timestamp: string;
  userId?: string;
}

export class WhatsAppGatewayService {
  static verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    const result = verifyWebhookChallenge(mode, token, challenge);
    return result.verified ? result.challenge : null;
  }

  static verifySignature(signature: string | null, rawBody: string): boolean {
    return verifyWebhookSignature(signature, rawBody);
  }

  static async processInboundCommand(
    payload: WhatsAppInboundMessage
  ): Promise<{ replyText: string; success: boolean }> {
    if (!payload.userId) {
      return {
        success: false,
        replyText: 'WHATSAPP_USER_NOT_LINKED'
      };
    }

    if (!payload.text?.trim()) {
      return {
        success: false,
        replyText: 'WHATSAPP_TEXT_REQUIRED'
      };
    }

    const result = await runMentra({
      userId: payload.userId,
      channel: 'WHATSAPP',
      externalMessageId: payload.messageId,
      text: payload.text.trim(),
      timestamp: payload.timestamp || new Date().toISOString()
    });

    return {
      success: result.success,
      replyText: result.message || result.error || 'MENTRA_RESPONSE_UNAVAILABLE'
    };
  }

  static async sendExecutiveAlert(
    toPhoneNumber: string,
    message: string,
    userId?: string,
    deduplicationKey?: string
  ): Promise<boolean> {
    const result = await whatsappClient.sendTextMessage(
      toPhoneNumber,
      message,
      userId,
      deduplicationKey
    );

    return result.success;
  }
}
