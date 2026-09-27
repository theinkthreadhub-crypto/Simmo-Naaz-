import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const envKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET;

  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TOKEN_ENCRYPTION_KEY_MISSING');
    }
    return crypto.scryptSync('mentra_local_dev_token_salt_2026', 'mentra_salt', 32);
  }

  if (/^[a-fA-F0-9]{64}$/.test(envKey)) {
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
  if (!plainText) throw new Error('TOKEN_PLAINTEXT_REQUIRED');

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ]);

  return {
    ciphertext: encrypted.toString('base64url'),
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url')
  };
}

export function decryptToken(encryptedData: EncryptedData): string {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'base64url');
    const tag = Buffer.from(encryptedData.tag, 'base64url');
    const encrypted = Buffer.from(encryptedData.ciphertext, 'base64url');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  } catch {
    throw new Error('TOKEN_DECRYPTION_FAILED');
  }
}
