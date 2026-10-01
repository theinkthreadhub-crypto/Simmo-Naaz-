import { NextRequest, NextResponse } from 'next/server';
import {
  filterAllowedSenders,
  getAllowedWhatsAppNumbers,
  verifyWebhookChallenge,
  verifyWebhookSignature
} from '@/lib/integrations/whatsapp/security';
import { processWhatsAppInboundWebhook, WhatsAppInboundPayload } from '@/lib/integrations/whatsapp/handler';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET Handler: Meta Webhook Verification Handshake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verification = verifyWebhookChallenge(mode, token, challenge);
  if (verification.verified && verification.challenge) {
    return new NextResponse(verification.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

/**
 * POST Handler: Meta Webhook Inbound Event Intake
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.WHATSAPP_CLOUD_WEBHOOK_ENABLED !== 'true') {
      return NextResponse.json({
        success: true,
        processed: 0,
        disabled: true,
        mode: 'QR_SELF_CHAT_ONLY'
      });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Signature Verification
    const isSigValid = verifyWebhookSignature(signature, rawBody);
    if (!isSigValid) {
      console.warn('[WhatsAppWebhook] Unauthorized signature rejected');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }

    // 2. Parse Payload
    const parsedPayload: WhatsAppInboundPayload = JSON.parse(rawBody);

    const allowedNumbers = getAllowedWhatsAppNumbers();
    if (allowedNumbers.length === 0) {
      console.warn('[WhatsAppWebhook] Cloud inbound ignored because WHATSAPP_ALLOWED_NUMBERS is empty.');
      return NextResponse.json({ success: true, processed: 0, ignored: true });
    }

    const { payload, ignored } = filterAllowedSenders(parsedPayload);
    if (ignored > 0) {
      console.warn(`[WhatsAppWebhook] Ignored ${ignored} message(s) from numbers outside WHATSAPP_ALLOWED_NUMBERS.`);
    }

    // 3. Meta webhooks carry no user cookie. After the HMAC check passes, run the
    // pipeline in the trusted server scope so Supabase reads/writes are not
    // blocked by RLS. The handler scopes every query to the linked user.
    const result = await runAsTrustedServer('whatsapp_webhook', () =>
      processWhatsAppInboundWebhook(payload)
    );

    return NextResponse.json({ success: true, processed: result.processed });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[WhatsAppWebhook] Processing error:', errorMsg);
    // Still return 200 to Meta to prevent duplicate webhook delivery storm
    return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
  }
}
