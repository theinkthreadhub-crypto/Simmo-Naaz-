import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Trusted server scope for requests that are authenticated by something other
 * than a user cookie (for example a Meta webhook with a verified HMAC signature).
 *
 * Inside this scope, createClient() from '@/lib/supabase/server' returns the
 * service-role client, so RLS does not block server-side processing.
 * Only enter this scope AFTER the request has been verified.
 */
const trustedScope = new AsyncLocalStorage<{ reason: string }>();

export function runAsTrustedServer<T>(reason: string, fn: () => Promise<T>): Promise<T> {
  return trustedScope.run({ reason }, fn);
}

export function isTrustedServerScope(): boolean {
  return Boolean(trustedScope.getStore());
}
