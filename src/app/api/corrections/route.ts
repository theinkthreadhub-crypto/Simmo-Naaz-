import { NextResponse, type NextRequest } from 'next/server';
import { applyUserCorrection, getActiveCorrections } from '@/lib/feedback/correctionEngine';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const body = await request.json();
    if (!body.correctionType || !body.targetEntityType || !body.newValue) {
      return NextResponse.json({ error: 'correctionType, targetEntityType, and newValue are required.' }, { status: 400 });
    }

    const res = await applyUserCorrection(userId, body);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  const corrections = await getActiveCorrections(userId);
  return NextResponse.json({ corrections });
}
