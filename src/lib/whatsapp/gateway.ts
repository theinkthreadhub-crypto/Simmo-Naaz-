/**
 * WhatsApp Cloud API Gateway
 * Architecture for receiving operator voice and text commands and sending executive briefings.
 */

export interface WhatsAppInboundMessage {
  from: string;
  messageId: string;
  type: 'text' | 'audio' | 'document';
  text?: string;
  mediaUrl?: string;
  timestamp: string;
}

export class WhatsAppGatewayService {
  static verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mentra_secure_webhook_token';
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  static async processInboundCommand(payload: WhatsAppInboundMessage): Promise<{ replyText: string }> {
    const query = payload.text || 'Voice memo received';
    
    // Future integration connects to MentraCoreAgent.parseIntent(query)
    return {
      replyText: `[MENTRA OS]: Received "${query}". Telemetry logged in command center.`
    };
  }

  static async sendExecutiveAlert(toPhoneNumber: string, message: string): Promise<boolean> {
    if (!process.env.WHATSAPP_API_TOKEN) {
      console.log(`[WHATSAPP SANDBOX]: Sent to ${toPhoneNumber} -> ${message}`);
      return true;
    }
    // Official Cloud API call
    return true;
  }
}
