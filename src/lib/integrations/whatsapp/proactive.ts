import { whatsappClient, WhatsAppSendResult } from './client';

export interface ProactiveWhatsAppInput {
  userId: string;
  phoneNumber: string;
  lastActiveAt?: string | null;
  text: string;
  templateName?: string;
  templateParameters?: string[];
  deduplicationKey: string;
}

function isInsideCustomerCareWindow(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  const last = new Date(lastActiveAt).getTime();
  if (!Number.isFinite(last)) return false;

  // Stay slightly inside the 24-hour Meta customer-service window.
  return Date.now() - last < 23 * 60 * 60 * 1000;
}

export async function sendProactiveWhatsApp(
  input: ProactiveWhatsAppInput
): Promise<WhatsAppSendResult & { mode?: 'TEXT' | 'TEMPLATE' }> {
  if (isInsideCustomerCareWindow(input.lastActiveAt)) {
    const result = await whatsappClient.sendTextMessage(
      input.phoneNumber,
      input.text,
      input.userId,
      input.deduplicationKey
    );
    return { ...result, mode: 'TEXT' };
  }

  if (!input.templateName) {
    return {
      success: false,
      error: 'WHATSAPP_TEMPLATE_REQUIRED_OUTSIDE_24H_WINDOW'
    };
  }

  const result = await whatsappClient.sendTemplateMessage(
    input.phoneNumber,
    input.templateName,
    input.templateParameters || [],
    {
      userId: input.userId,
      deduplicationKey: input.deduplicationKey,
      languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
    }
  );

  return { ...result, mode: 'TEMPLATE' };
}
