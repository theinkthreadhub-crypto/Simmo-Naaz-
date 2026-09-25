import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRoutine, listUserRoutines } from '@/lib/db/routines';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const routines = await listUserRoutines(user.id);
  return NextResponse.json({ success: true, routines });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, routineType, durationMinutes, steps, triggerTime, days } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'NAME_REQUIRED' }, { status: 400 });
    }

    const routine = await createRoutine(user.id, {
      name,
      routineType,
      durationMinutes,
      steps,
      triggerTime,
      days
    });

    return NextResponse.json({ success: true, routine });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
