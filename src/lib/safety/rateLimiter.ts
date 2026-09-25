export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterSeconds?: number;
}

interface WindowRecord {
  timestamps: number[];
}

const rateLimitStores = new Map<string, Map<string, WindowRecord>>();

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 10, windowMs: 60 * 1000 },          // 10 req/min for auth
  ai_chat: { maxRequests: 30, windowMs: 60 * 1000 },       // 30 req/min for AI chat
  voice: { maxRequests: 15, windowMs: 60 * 1000 },         // 15 req/min for voice synthesis/STT
  tools: { maxRequests: 60, windowMs: 60 * 1000 },         // 60 tool calls/min
  webhook: { maxRequests: 120, windowMs: 60 * 1000 },      // 120 webhooks/min
  research: { maxRequests: 10, windowMs: 60 * 1000 },      // 10 deep research tasks/min
  api_global: { maxRequests: 100, windowMs: 60 * 1000 }    // 100 general requests/min
};

/**
 * Evaluates rate limit for a given key and category.
 */
export function checkRateLimit(
  category: keyof typeof DEFAULT_RATE_LIMITS | string,
  identifier: string,
  customConfig?: RateLimitConfig
): RateLimitResult {
  const config = customConfig || DEFAULT_RATE_LIMITS[category] || DEFAULT_RATE_LIMITS.api_global;
  const now = Date.now();

  if (!rateLimitStores.has(category)) {
    rateLimitStores.set(category, new Map());
  }

  const categoryStore = rateLimitStores.get(category)!;
  let record = categoryStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    categoryStore.set(identifier, record);
  }

  // Filter timestamps within the window
  const windowStart = now - config.windowMs;
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = (oldestTimestamp + config.windowMs) - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

    return {
      allowed: false,
      remaining: 0,
      resetMs,
      retryAfterSeconds
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
    resetMs: config.windowMs
  };
}

/**
 * Resets the rate limit for a specific identifier (useful for testing).
 */
export function resetRateLimit(category: string, identifier: string): void {
  const categoryStore = rateLimitStores.get(category);
  if (categoryStore) {
    categoryStore.delete(identifier);
  }
}
