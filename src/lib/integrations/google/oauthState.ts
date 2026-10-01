import crypto from 'crypto';

export const GOOGLE_STATE_COOKIE = 'mentra_google_oauth_state';
export const GOOGLE_STATE_TTL_SECONDS = 600;

export function createGoogleOAuthState(userId: string): string {
  return Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(32).toString('base64url')
  })).toString('base64url');
}

export function validateGoogleOAuthState(state: string | null, savedState: string | undefined, userId: string): boolean {
  if (!state || !savedState || !userId || state.length > 2048) return false;
  const a = Buffer.from(state);
  const b = Buffer.from(savedState);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const age = Date.now() - payload.timestamp;
    return payload.userId === userId &&
      typeof payload.timestamp === 'number' && age >= 0 && age < GOOGLE_STATE_TTL_SECONDS * 1000 &&
      typeof payload.nonce === 'string' && payload.nonce.length >= 32;
  } catch {
    return false;
  }
}
