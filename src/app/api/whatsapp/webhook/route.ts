import { NextRequest, NextResponse } from 'next/server';
import {
  filterAllowedSenders,
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

    // Only the owner numbers in WHATSAPP_ALLOWED_NUMBERS may talk to MENTRA.
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

    if (result.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          processed: result.processed,
          duplicates: result.duplicates,
          errors: result.errors.slice(0, 10)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      duplicates: result.duplicates
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[WhatsAppWebhook] Processing error:', errorMsg);
    // Return a retryable error. Successfully processed provider message IDs are
    // idempotently skipped on the next delivery.
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
