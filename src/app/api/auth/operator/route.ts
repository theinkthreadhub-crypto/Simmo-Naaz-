import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPERATOR_ID = 'inkthread';
const OPERATOR_USER_ID = '1d70b737-0e87-4718-95b7-21d5ab3254ed';

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Authentication service is not configured.');
  }

  return { url, anonKey, serviceRoleKey };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (identifier !== OPERATOR_ID || !password) {
      return NextResponse.json({ error: 'Invalid operator credentials.' }, { status: 401 });
    }

    const { url, anonKey, serviceRoleKey } = getConfig();

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: operator, error: operatorError } = await admin.auth.admin.getUserById(OPERATOR_USER_ID);
    const email = operator?.user?.email;

    if (operatorError || !email) {
      return NextResponse.json({ error: 'Operator access is unavailable.' }, { status: 503 });
    }

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await auth.auth.signInWithPassword({ email, password });

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
