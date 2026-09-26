import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPERATOR_ID = 'inkthread';
const OPERATOR_EMAIL = 'theinkthreadhub@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (identifier !== OPERATOR_ID || !password) {
      return NextResponse.json({ error: 'Invalid operator credentials.' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 503 });
    }

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await auth.auth.signInWithPassword({
      email: OPERATOR_EMAIL,
      password
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: 'Invalid operator credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        user_metadata: data.user.user_metadata
      }
    });
  } catch {
    return NextResponse.json({ error: 'Authentication provider unavailable.' }, { status: 503 });
  }
}
