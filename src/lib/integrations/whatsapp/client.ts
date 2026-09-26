import { createClient } from '@/lib/supabase/server';

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mock?: boolean;
}

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
  }

  public isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  /**
   * Send a standard text message to a WhatsApp user
   */
  async sendTextMessage(to: string, text: string, userId?: string): Promise<WhatsAppSendResult> {
    const cleanPhone = to.replace(/[^0-9]/g, '');

    if (!this.isConfigured()) {
      // Graceful unconfigured logging - does not fake successful sending to Meta
      console.warn('[WhatsAppClient] Credentials not configured. Outbound message skipped.');
      if (userId) {
        await this.logOutbound(userId, cleanPhone, 'TEXT', text, 'FAILED', undefined, 'WhatsApp credentials not configured in environment');
      }
      return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText;
        if (userId) {
          await this.logOutbound(userId, cleanPhone, 'TEXT', text, 'FAILED', undefined, errorMsg);
        }
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      if (userId) {
        await this.logOutbound(userId, cleanPhone, 'TEXT', text, 'SENT', messageId);
      }
      return { success: true, messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (userId) {
        await this.logOutbound(userId, cleanPhone, 'TEXT', text, 'FAILED', undefined, errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send interactive quick-reply buttons (e.g. for Approvals or Quests)
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    userId?: string
  ): Promise<WhatsAppSendResult> {
    const cleanPhone = to.replace(/[^0-9]/g, '');

    if (!this.isConfigured()) {
      return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.slice(0, 3).map((btn) => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title.slice(0, 20) // WhatsApp limit
                }
              }))
            }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText;
        if (userId) {
          await this.logOutbound(userId, cleanPhone, 'INTERACTIVE', bodyText, 'FAILED', undefined, errorMsg);
        }
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      if (userId) {
        await this.logOutbound(userId, cleanPhone, 'INTERACTIVE', bodyText, 'SENT', messageId);
      }
      return { success: true, messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Log outbound message delivery record
   */
  private async logOutbound(
    userId: string,
    recipientPhone: string,
    messageType: string,
    content: string,
    status: 'SENT' | 'FAILED' | 'DELIVERED',
    providerMessageId?: string,
    error?: string
  ): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.from('outbound_messages').insert({
        user_id: userId,
        channel: 'WHATSAPP',
        recipient: recipientPhone,
        message_type: messageType,
        content,
        provider_message_id: providerMessageId,
        status,
        error,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[WhatsAppClient] Failed to log outbound message:', e);
    }
  }
}

export const whatsappClient = new WhatsAppClient();
