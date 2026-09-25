export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  correlationId?: string;
  userId?: string;
  route?: string;
  module: string;
  message: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  errorCode?: string;
}

// Patterns that must be sanitized from log output
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apikey',
  'authorization',
  'bearer',
  'access_token',
  'refresh_token',
  'credit_card',
  'cookie'
];

/**
 * Recursively redacts sensitive keys and values from log metadata.
 */
function sanitizeMetadata(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Redact Bearer tokens or long JWT-like strings
    if (/Bearer\s+[A-Za-z0-9\-_.]+/i.test(obj)) {
      return obj.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]');
    }
    if (/eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/.test(obj)) {
      return '[REDACTED_JWT]';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeMetadata(item));
  }
  if (typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitizeMetadata(value);
      }
    }
    return clean;
  }
  return obj;
}

export class Logger {
  private module: string;
  private correlationId?: string;
  private userId?: string;

  constructor(module: string, context?: { correlationId?: string; userId?: string }) {
    this.module = module;
    this.correlationId = context?.correlationId;
    this.userId = context?.userId ? `user_${context.userId.substring(0, 8)}***` : undefined;
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', message, metadata);
  }

  public error(message: string, errorCode?: string, metadata?: Record<string, unknown>): void {
    this.log('ERROR', message, metadata, errorCode);
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, metadata);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    errorCode?: string
  ): void {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      correlationId: this.correlationId,
      userId: this.userId,
      errorCode,
      metadata: metadata ? (sanitizeMetadata(metadata) as Record<string, unknown>) : undefined
    };

    const formatted = `[${entry.timestamp}] [${entry.level}] [${entry.module}]${entry.correlationId ? ` [${entry.correlationId}]` : ''}: ${entry.message}`;

    if (level === 'ERROR') {
      console.error(formatted, entry.metadata || '');
    } else if (level === 'WARN') {
      console.warn(formatted, entry.metadata || '');
    } else {
      console.log(formatted, entry.metadata || '');
    }
  }
}
