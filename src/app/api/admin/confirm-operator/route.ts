import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPERATOR_USER_ID = '1d70b737-0e87-4718-95b7-21d5ab3254ed';
const TOKEN_SHA256 = 'f0ba22c0c88ac94e2ff958104dd1ef9d2de631cd3e6bfd05e9ecf77878c87394';

function validToken(token: string) {
  const actual = crypto.createHash('sha256').update(token).digest();
  const expected = Buffer.from(TOKEN_SHA256, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token') || '';
    if (!validToken(token)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 503 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error: userError } = await admin.auth.admin.updateUserById(OPERATOR_USER_ID, {
      email_confirm: true,
      user_metadata: { display_name: 'InkThread' }
    });

    if (userError) {
      return NextResponse.json({ error: 'Operator activation failed.' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: OPERATOR_USER_ID,
      display_name: 'InkThread',
      timezone: 'Asia/Kolkata',
      preferred_language: 'en',
      onboarding_completed: true,
      updated_at: now
    }, { onConflict: 'user_id' });

    if (profileError) {
      return NextResponse.json({ error: 'Operator profile activation failed.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Activation failed.' }, { status: 500 });
  }
}
