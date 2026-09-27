import { createClient } from '@/lib/supabase/server';

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppTemplateParameter {
  type: 'text';
  text: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  replayed?: boolean;
}

interface SendOptions {
  userId?: string;
  deduplicationKey?: string;
}

function cleanPhoneNumber(value: string): string | null {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  return /^[0-9]{8,15}$/.test(digits) ? digits : null;
}

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  public isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  private async reserveOutbound(
    recipient: string,
    messageType: 'TEXT' | 'TEMPLATE' | 'INTERACTIVE',
    content: string,
    options: SendOptions
  ): Promise<{ rowId?: string; replay?: WhatsAppSendResult; error?: string }> {
    if (!options.userId || !options.deduplicationKey) return {};

    const supabase = createClient();
    const { data, error } = await supabase
      .from('outbound_messages')
      .insert({
        user_id: options.userId,
        channel: 'WHATSAPP',
        recipient,
        message_type: messageType,
        content,
        status: 'QUEUED',
        deduplication_key: options.deduplicationKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (!error && data?.id) return { rowId: data.id };

    if (error?.code !== '23505') {
      return { error: error?.message || 'OUTBOUND_RESERVATION_FAILED' };
    }

    const { data: existing } = await supabase
      .from('outbound_messages')
      .select('id, status, provider_message_id, error')
      .eq('user_id', options.userId)
      .eq('deduplication_key', options.deduplicationKey)
      .maybeSingle();

    if (!existing) return { error: 'OUTBOUND_RESERVATION_CONFLICT' };

    if (['SENT', 'DELIVERED', 'READ'].includes(existing.status)) {
      return {
        replay: {
          success: true,
          messageId: existing.provider_message_id || undefined,
          replayed: true
        }
      };
    }

    if (existing.status === 'QUEUED') {
      return { error: 'OUTBOUND_ALREADY_IN_PROGRESS' };
    }

    const { data: reclaimed } = await supabase
      .from('outbound_messages')
      .update({
        status: 'QUEUED',
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('status', 'FAILED')
      .select('id')
      .maybeSingle();

    return reclaimed?.id
      ? { rowId: reclaimed.id }
      : { error: 'OUTBOUND_RETRY_ALREADY_CLAIMED' };
  }

  private async finalizeOutbound(
    rowId: string | undefined,
    options: SendOptions,
    recipient: string,
    messageType: 'TEXT' | 'TEMPLATE' | 'INTERACTIVE',
    content: string,
    status: 'SENT' | 'FAILED',
    providerMessageId?: string,
    error?: string
  ): Promise<void> {
    if (!options.userId) return;

    const supabase = createClient();
    const payload = {
      provider_message_id: providerMessageId || null,
      status,
      error: error || null,
      updated_at: new Date().toISOString()
    };

    if (rowId) {
      await supabase
        .from('outbound_messages')
        .update(payload)
        .eq('id', rowId)
        .eq('user_id', options.userId);
      return;
    }

    await supabase.from('outbound_messages').insert({
      user_id: options.userId,
      channel: 'WHATSAPP',
      recipient,
      message_type: messageType,
      content,
      provider_message_id: providerMessageId || null,
      status,
      error: error || null,
      deduplication_key: options.deduplicationKey || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  private async sendPayload(
    recipient: string,
    messageType: 'TEXT' | 'TEMPLATE' | 'INTERACTIVE',
    contentForAudit: string,
    payload: Record<string, unknown>,
    options: SendOptions = {}
  ): Promise<WhatsAppSendResult> {
    const cleanPhone = cleanPhoneNumber(recipient);
    if (!cleanPhone) return { success: false, error: 'INVALID_WHATSAPP_PHONE' };

    const reservation = await this.reserveOutbound(
      cleanPhone,
      messageType,
      contentForAudit,
      options
    );

    if (reservation.replay) return reservation.replay;
    if (reservation.error) return { success: false, error: reservation.error };

    if (!this.isConfigured()) {
      await this.finalizeOutbound(
        reservation.rowId,
        options,
        cleanPhone,
        messageType,
        contentForAudit,
        'FAILED',
        undefined,
        'WHATSAPP_NOT_CONFIGURED'
      );
      return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15_000),
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            ...payload
          })
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          data?.error?.error_user_msg ||
          `WHATSAPP_API_ERROR_${response.status}`;

        await this.finalizeOutbound(
          reservation.rowId,
          options,
          cleanPhone,
          messageType,
          contentForAudit,
          'FAILED',
          undefined,
          errorMessage
        );

        return { success: false, error: errorMessage };
      }

      const messageId = data?.messages?.[0]?.id;
      if (!messageId) {
        await this.finalizeOutbound(
          reservation.rowId,
          options,
          cleanPhone,
          messageType,
          contentForAudit,
          'FAILED',
          undefined,
          'WHATSAPP_MESSAGE_ID_MISSING'
        );
        return { success: false, error: 'WHATSAPP_MESSAGE_ID_MISSING' };
      }

      await this.finalizeOutbound(
        reservation.rowId,
        options,
        cleanPhone,
        messageType,
        contentForAudit,
        'SENT',
        messageId
      );

      return { success: true, messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.finalizeOutbound(
        reservation.rowId,
        options,
        cleanPhone,
        messageType,
        contentForAudit,
        'FAILED',
        undefined,
        message
      );

      return { success: false, error: message };
    }
  }

  async sendTextMessage(
    to: string,
    text: string,
    userId?: string,
    deduplicationKey?: string
  ): Promise<WhatsAppSendResult> {
    const body = String(text || '').trim();
    if (!body) return { success: false, error: 'WHATSAPP_TEXT_REQUIRED' };

    return this.sendPayload(
      to,
      'TEXT',
      body,
      {
        type: 'text',
        text: { preview_url: false, body: body.slice(0, 4096) }
      },
      { userId, deduplicationKey }
    );
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: string[] = [],
    options: SendOptions & { languageCode?: string } = {}
  ): Promise<WhatsAppSendResult> {
    const name = String(templateName || '').trim();
    if (!name) return { success: false, error: 'WHATSAPP_TEMPLATE_REQUIRED' };

    const components = parameters.length > 0
      ? [{
          type: 'body',
          parameters: parameters.slice(0, 20).map(value => ({
            type: 'text',
            text: String(value).slice(0, 1024)
          }))
        }]
      : undefined;

    return this.sendPayload(
      to,
      'TEMPLATE',
      `template:${name}`,
      {
        type: 'template',
        template: {
          name,
          language: { code: options.languageCode || 'en_US' },
          ...(components ? { components } : {})
        }
      },
      options
    );
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    userId?: string,
    deduplicationKey?: string
  ): Promise<WhatsAppSendResult> {
    const usableButtons = buttons
      .filter(button => button.id && button.title)
      .slice(0, 3);

    if (usableButtons.length === 0) {
      return { success: false, error: 'WHATSAPP_BUTTONS_REQUIRED' };
    }

    return this.sendPayload(
      to,
      'INTERACTIVE',
      bodyText,
      {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText.slice(0, 1024) },
          action: {
            buttons: usableButtons.map(button => ({
              type: 'reply',
              reply: {
                id: button.id.slice(0, 256),
                title: button.title.slice(0, 20)
              }
            }))
          }
        }
      },
      { userId, deduplicationKey }
    );
  }
}

export const whatsappClient = new WhatsAppClient();
