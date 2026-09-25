import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  let cookieStore: any = null;
  try {
    cookieStore = cookies();
  } catch {
    // Outside Next.js request scope (e.g., CLI evaluation script or tests)
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore?.set({ name, value, ...options });
        } catch {
          // In Server Components, ignore cookie mutation
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore?.delete({ name, ...options });
        } catch {
          // In Server Components, ignore cookie deletion
        }
      },
    },
  });
}
