import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet with valid production URL, let request proceed to client AppShell
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const protectedRoutes = [
    '/system',
    '/quests',
    '/goals',
    '/finance',
    '/skills',
    '/journal',
    '/calendar',
    '/memory',
    '/agents',
    '/reports',
    '/connections',
    '/settings',
    '/habits',
    '/projects',
    '/missions',
    '/focus'
  ];

  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path));

  // If unauthenticated accessing protected route, redirect to root login screen
  if (isProtectedRoute && !user) {
    // Check if client has demo session cookie
    const hasDemoCookie = request.cookies.get('mentra_demo_active');
    if (!hasDemoCookie) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
