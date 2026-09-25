import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHabit, listUserHabits } from '@/lib/db/habits';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const habits = await listUserHabits(user.id);
  return NextResponse.json({ success: true, habits });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, lifeArea, frequency, targetCount, preferredTime, difficulty, relatedGoalId, relatedSkillId, xpReward } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'TITLE_REQUIRED' }, { status: 400 });
    }

    const habit = await createHabit(user.id, {
      title,
      description,
      lifeArea,
      frequency,
      targetCount,
      preferredTime,
      difficulty,
      relatedGoalId,
      relatedSkillId,
      xpReward
    });

    return NextResponse.json({ success: true, habit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
