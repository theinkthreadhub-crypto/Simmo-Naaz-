import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const envKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET;
  if (!envKey) {
    // Deterministic fallback for local development if not yet set
    return crypto.scryptSync('mentra_local_dev_token_salt_2026', 'mentra_salt', 32);
  }

  if (envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }

  return crypto.scryptSync(envKey, 'mentra_salt', 32);
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptToken(plainText: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

export function decryptToken(encryptedData: EncryptedData): string {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err: any) {
    console.error('[CRYPTO]: Failed to decrypt token:', err.message);
    throw new Error('TOKEN_DECRYPTION_FAILED');
  }
}
