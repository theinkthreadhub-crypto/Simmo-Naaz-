import crypto from 'crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PROVISIONED_WORKER_PUBLIC_KEY } from './trustedPublicKey';

const PROVISIONED_WORKER_TOKEN_HASH = '9550c0c694c3af6f2205f211ff7d15c05bf566b2da1c23287c4b64f55929cd89';

function safeEqual(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyBrainWorkerSecret(provided: string | null): boolean {
  if (!provided) return false;
  const expected = process.env.BRAIN_WORKER_SECRET;
  return Boolean(expected && expected.length >= 32 && safeEqual(provided, expected));
}

export function verifyBrainWorkerServiceKey(provided: string | null): boolean {
  if (!provided) return false;
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return Boolean(expected && safeEqual(provided, expected));
}

export function verifyBrainWorkerToken(provided: string | null): boolean {
  if (!provided) return false;

  const expectedHashes = [
    process.env.BRAIN_WORKER_TOKEN_HASH,
    PROVISIONED_WORKER_TOKEN_HASH
  ].filter((value): value is string => Boolean(value));

  const actualHash = crypto
    .createHash('sha256')
    .update(provided)
    .digest('hex');

  return expectedHashes.some(expectedHash => safeEqual(actualHash, expectedHash));
}

export function verifyBrainWorkerSignature(
  timestampHeader: string | null,
  signatureHeader: string | null,
  rawBody: string
): boolean {
  if (!timestampHeader || !signatureHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;

  const maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestamp) > maxSkewMs) return false;

  try {
    const publicKeys = [process.env.BRAIN_WORKER_PUBLIC_KEY?.replace(/\\n/g, '\n'), PROVISIONED_WORKER_PUBLIC_KEY].filter(Boolean) as string[];
    return publicKeys.some(publicKey => {
      try {
        return crypto.verify(
          null,
          Buffer.from(`${timestampHeader}.${rawBody}`, 'utf8'),
          crypto.createPublicKey(publicKey),
          Buffer.from(signatureHeader, 'base64')
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export async function verifySupabaseUserToken(
  token: string
): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return null;

  const client = createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}
