import crypto from 'crypto';

export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null
): { verified: boolean; challenge: string | null } {
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken) {
    console.warn('[WHATSAPP SECURITY]: WHATSAPP_VERIFY_TOKEN is not configured in environment.');
    return { verified: false, challenge: null };
  }

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return { verified: true, challenge };
  }

  return { verified: false, challenge: null };
}

export function verifyWebhookSignature(signatureHeader: string | null, rawBody: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // If not configured in local testing, log warning
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signatureHeader.slice(7);
  const hmac = crypto.createHmac('sha256', appSecret);
  const computedSignature = hmac.update(rawBody).digest('hex');

  try {
    const computedBuf = Buffer.from(computedSignature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    if (computedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, expectedBuf);
  } catch {
    return false;
  }
}
