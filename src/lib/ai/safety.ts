import { ToolPermissionLevel } from './types';

// In-memory rate limiter per user
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const limit = Number(process.env.AI_DAILY_REQUEST_LIMIT_PER_USER) || 200;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let record = userRequestCounts.get(userId);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + oneDayMs };
    userRequestCounts.set(userId, record);
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.round((record.resetTime - now) / 1000)
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSec: Math.round((record.resetTime - now) / 1000)
  };
}

export function sanitizeInputText(text: string, maxLength: number = 4000): string {
  if (!text) return '';
  let sanitized = text.slice(0, maxLength).trim();
  // Strip control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return sanitized;
}

export function isApprovalRequired(permission: ToolPermissionLevel): boolean {
  return permission === 'APPROVAL_REQUIRED';
}
