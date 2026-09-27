import crypto from 'crypto';

const MAX_STATE_AGE_MS = 10 * 60 * 1000;

interface GoogleOAuthStatePayload {
  userId: string;
  issuedAt: number;
  nonce: string;
}

function getStateSecret(): string {
  const secret =
    process.env.GOOGLE_OAUTH_STATE_SECRET ||
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GOOGLE_OAUTH_STATE_SECRET_MISSING');
    }
    return 'mentra-dev-google-oauth-state-secret';
  }

  return secret;
}

function sign(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', getStateSecret())
    .update(encodedPayload)
    .digest('base64url');
}

export function createGoogleOAuthState(userId: string): string {
  if (!userId) throw new Error('GOOGLE_OAUTH_STATE_USER_REQUIRED');

  const payload: GoogleOAuthStatePayload = {
    userId,
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(18).toString('base64url')
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyGoogleOAuthState(state: string): GoogleOAuthStatePayload {
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature) throw new Error('INVALID_STATE_TOKEN');

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('INVALID_STATE_SIGNATURE');
  }

  let payload: GoogleOAuthStatePayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new Error('INVALID_STATE_PAYLOAD');
  }

  if (!payload.userId || !payload.issuedAt || !payload.nonce) {
    throw new Error('INVALID_STATE_PAYLOAD');
  }

  if (Date.now() - payload.issuedAt > MAX_STATE_AGE_MS || payload.issuedAt > Date.now() + 60_000) {
    throw new Error('OAUTH_STATE_EXPIRED');
  }

  return payload;
}
