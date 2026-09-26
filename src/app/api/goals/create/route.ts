import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'Goal title is required.' }, { status: 400 });

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        description: typeof body.description === 'string' ? body.description.trim() : '',
        category: body.category || 'BUSINESS',
        target_value: 100,
        current_value: 0,
        unit: '%',
        target_date: body.target_date || null,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (goalError || !goal) throw new Error(goalError?.message || 'Failed to create goal.');

    const requestedMilestones = Array.isArray(body.milestones)
      ? body.milestones
          .map((item: any) => ({
            title: typeof item?.title === 'string' ? item.title.trim() : '',
            targetValue: Number(item?.targetValue || 100),
            unit: item?.unit || '%',
            rewardXp: Math.max(0, Number(item?.rewardXp || 75))
          }))
          .filter((item: any) => item.title)
      : [];

    let createdMilestones: any[] = [];
    if (requestedMilestones.length > 0) {
      const { data, error } = await supabase
        .from('goal_milestones')
        .insert(requestedMilestones.map((item: any) => ({
          goal_id: goal.id,
          user_id: user.id,
          title: item.title,
          target_value: item.targetValue,
          current_value: 0,
          unit: item.unit,
          reward_xp: item.rewardXp,
          completed: false
        })))
        .select();

      if (error) throw error;
      createdMilestones = data || [];
    }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'GOAL_CREATED',
      module: 'GOALS',
      details: { goalId: goal.id, title: goal.title, category: goal.category }
    });

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        milestones: createdMilestones.map(m => ({
          id: m.id,
          goal_id: m.goal_id,
          title: m.title,
          targetValue: m.target_value,
          currentValue: m.current_value,
          unit: m.unit,
          completed: m.completed,
          rewardXp: m.reward_xp
        })),
        progressPercent: 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
