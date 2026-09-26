const SENSITIVE_KEY =
  /(password|passwd|passcode|secret|token|api[_-]?key|authorization|credential|private[_-]?key|refresh[_-]?token|access[_-]?token)/i;

const JWT_PATTERN = /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi;
const OPENAI_LIKE_KEY = /\bsk-[A-Za-z0-9_-]{16,}\b/g;
const GOOGLE_API_KEY = /\bAIza[A-Za-z0-9_-]{20,}\b/g;
const EMAIL_PATTERN = /\b([A-Z0-9._%+-]{1,3})[A-Z0-9._%+-]*@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const IN_PHONE_PATTERN = /\b(?:\+?91[-\s]?)?([6-9])\d{8}(\d)\b/g;
const AADHAAR_PATTERN = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;

function redactString(value: string): string {
  return value
    .replace(JWT_PATTERN, '[REDACTED_JWT]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(OPENAI_LIKE_KEY, '[REDACTED_API_KEY]')
    .replace(GOOGLE_API_KEY, '[REDACTED_API_KEY]')
    .replace(AADHAAR_PATTERN, '[REDACTED_ID]')
    .replace(EMAIL_PATTERN, '$1***@$2')
    .replace(IN_PHONE_PATTERN, '$1*******$2');
}

export function redactForAudit<T>(value: T, depth: number = 0): T {
  if (depth > 8 || value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => redactForAudit(item, depth + 1)) as T;
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEY.test(key)
        ? '[REDACTED]'
        : redactForAudit(child, depth + 1);
    }

    return output as T;
  }

  return value;
}
