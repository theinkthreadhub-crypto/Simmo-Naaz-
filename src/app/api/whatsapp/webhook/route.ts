import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookChallenge, verifyWebhookSignature } from '@/lib/integrations/whatsapp/security';
import { processWhatsAppInboundWebhook, WhatsAppInboundPayload } from '@/lib/integrations/whatsapp/handler';

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
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Signature Verification
    const isSigValid = verifyWebhookSignature(signature, rawBody);
    if (!isSigValid) {
      console.warn('[WhatsAppWebhook] Unauthorized signature rejected');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }

    // 2. Parse Payload
    const payload: WhatsAppInboundPayload = JSON.parse(rawBody);

    // 3. Process asynchronously or synchronously depending on load
    // WhatsApp requires < 3s HTTP ACK, so we acknowledge promptly while processing
    const result = await processWhatsAppInboundWebhook(payload);

    return NextResponse.json({ success: true, processed: result.processed });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[WhatsAppWebhook] Processing error:', errorMsg);
    // Still return 200 to Meta to prevent duplicate webhook delivery storm
    return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
  }
}
