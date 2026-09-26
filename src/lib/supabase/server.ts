import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';

function safeSecretEqual(provided: string | null | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isInternalServiceRequest(headerStore: ReturnType<typeof headers> | null): boolean {
  if (!headerStore) return false;

  const workerSecret = headerStore.get('x-mentra-internal-secret');
  if (safeSecretEqual(workerSecret, process.env.BRAIN_WORKER_SECRET)) {
    return true;
  }

  const authHeader = headerStore.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;
  return Boolean(cronSecret && safeSecretEqual(authHeader, `Bearer ${cronSecret}`));
}

export function createClient() {
  let cookieStore: any = null;
  let headerStore: ReturnType<typeof headers> | null = null;

  try {
    cookieStore = cookies();
  } catch {
    // Outside Next.js request scope.
  }

  try {
    headerStore = headers();
  } catch {
    // Outside Next.js request scope.
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Internal scheduler/worker requests are authenticated separately before
  // reaching application logic. Only those requests may use service-role.
  if (serviceRoleKey && isInternalServiceRequest(headerStore)) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  const bearer = headerStore?.get('authorization');
  const options: any = {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore?.set({ name, value, ...options });
        } catch {
          // Server Components cannot always mutate cookies.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore?.delete({ name, ...options });
        } catch {
          // Server Components cannot always mutate cookies.
        }
      }
    }
  };

  // Non-browser clients may pass a normal Supabase user access token.
  // This keeps RLS active and never grants service-role privileges.
  if (bearer && !isInternalServiceRequest(headerStore)) {
    options.global = { headers: { Authorization: bearer } };
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, options);
}
