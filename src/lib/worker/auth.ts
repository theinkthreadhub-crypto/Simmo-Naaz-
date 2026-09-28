import crypto from 'crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DEFAULT_WORKER_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAPI3D3XPFBvaudF6GRBmJ21KsF+i2o33eG2oCAUQhfyc=
-----END PUBLIC KEY-----`;

const DEFAULT_WORKER_TOKEN_HASH =
  'bcc6fa8390ec665681108a5516c9d1fd23fdfbe3102d9c9f12d0d4e77b11beac';

const ROTATED_WORKER_TOKEN_HASH =
  '91c584326132eb0f461381ee6b38467e87da96233cc969a38c56a29f5bbb5dec';

function safeEqual(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyBrainWorkerSecret(provided: string | null): boolean {
  return safeEqual(provided, process.env.BRAIN_WORKER_SECRET);
}

export function verifyBrainWorkerToken(provided: string | null): boolean {
  if (!provided) return false;

  const expectedHashes = [
    process.env.BRAIN_WORKER_TOKEN_HASH,
    DEFAULT_WORKER_TOKEN_HASH,
    ROTATED_WORKER_TOKEN_HASH
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
    const publicKey =
      process.env.BRAIN_WORKER_PUBLIC_KEY?.replace(/\\n/g, '\n') ||
      DEFAULT_WORKER_PUBLIC_KEY;

    return crypto.verify(
      null,
      Buffer.from(`${timestampHeader}.${rawBody}`, 'utf8'),
      crypto.createPublicKey(publicKey),
      Buffer.from(signatureHeader, 'base64')
    );
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
