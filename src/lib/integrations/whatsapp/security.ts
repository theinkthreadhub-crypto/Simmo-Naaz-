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

/** Digits only, with the country code (e.g. 916392995127). */
export function normalizeWhatsAppNumber(phone: string): string {
  return String(phone || '').replace(/[^0-9]/g, '');
}

/**
 * WHATSAPP_ALLOWED_NUMBERS: comma-separated owner numbers with country code,
 * e.g. "916392995127". When set, MENTRA only talks to these numbers and
 * silently ignores everyone else. When empty, the 6-digit link flow decides.
 */
export function getAllowedWhatsAppNumbers(): string[] {
  return (process.env.WHATSAPP_ALLOWED_NUMBERS || '')
    .split(',')
    .map(normalizeWhatsAppNumber)
    .filter(Boolean);
}

export function isAllowedWhatsAppSender(phone: string): boolean {
  const allowed = getAllowedWhatsAppNumbers();
  if (allowed.length === 0) return true;
  return allowed.includes(normalizeWhatsAppNumber(phone));
}

/** Removes messages from senders that are not on the allowlist. */
export function filterAllowedSenders<
  T extends { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from: string }> } }> }> }
>(payload: T): { payload: T; ignored: number } {
  let ignored = 0;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages) continue;
      const kept = value.messages.filter(message => isAllowedWhatsAppSender(message.from));
      ignored += value.messages.length - kept.length;
      value.messages = kept;
    }
  }
  return { payload, ignored };
}
