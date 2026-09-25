import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeHabitToday } from '@/lib/db/habits';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { habitId, source } = body;

    if (!habitId) {
      return NextResponse.json({ success: false, error: 'HABIT_ID_REQUIRED' }, { status: 400 });
    }

    const result = await completeHabitToday(user.id, habitId, source || 'WEB');
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
