import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const PRODUCTION_APP_URL = 'https://mentra.inkthreadhub.in';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component cookie set fallback
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch {
            // Server Component cookie delete fallback
          }
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Always return production auth flows to the canonical custom domain.
  const redirectOrigin =
    process.env.NODE_ENV === 'production' ? PRODUCTION_APP_URL : new URL(request.url).origin;
  return NextResponse.redirect(`${redirectOrigin}/`);
}
