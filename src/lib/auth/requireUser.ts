import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export class AuthRequiredError extends Error {
  constructor(message: string = 'AUTH_REQUIRED') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/**
 * Validates the authenticated Supabase session on the server.
 * Throws AuthRequiredError (or returns user) and NEVER trusts client-provided user IDs.
 */
export async function requireUser(): Promise<User> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Only in explicit development mode with MENTRA_DEMO_MODE=true is demo bypass allowed
    const isDev = process.env.NODE_ENV !== 'production';
    const isDemoEnabled = process.env.MENTRA_DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_MENTRA_DEMO_MODE === 'true';

    if (isDev && isDemoEnabled) {
      return {
        id: 'usr_operator_naaz',
        app_metadata: {},
        user_metadata: { display_name: 'Operator Naaz (Dev Demo)' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
    }

    throw new AuthRequiredError('AUTH_REQUIRED');
  }

  return user;
}

/**
 * Optional user retrieval that returns null if unauthenticated rather than throwing.
 */
export async function getOptionalUser(): Promise<User | null> {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}
