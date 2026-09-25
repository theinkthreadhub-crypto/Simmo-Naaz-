import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, target_date, milestones } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Goal title is required.' }, { status: 400 });
    }

    // 1. Create Goal
    const { data: goal, error: gErr } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description || '',
        category: category || 'BUSINESS',
        target_date: target_date || null,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (gErr || !goal) {
      return NextResponse.json({ error: gErr?.message || 'Failed to create goal' }, { status: 500 });
    }

    // 2. Create Milestones if provided
    const createdMilestones = [];
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      for (const m of milestones) {
        const { data: ms } = await supabase
          .from('goal_milestones')
          .insert({
            goal_id: goal.id,
            user_id: user.id,
            title: m.title || 'Milestone',
            target_value: m.targetValue || 100,
            current_value: 0,
            unit: m.unit || '%',
            reward_xp: m.rewardXp || 75,
            completed: false
          })
          .select()
          .single();

        if (ms) createdMilestones.push(ms);
      }
    } else {
      // Default 2 foundation milestones
      const def1 = await supabase.from('goal_milestones').insert({
        goal_id: goal.id,
        user_id: user.id,
        title: 'Phase 1: Architecture & Launchpad Complete',
        target_value: 100,
        reward_xp: 75,
        completed: false
      }).select().single();
      const def2 = await supabase.from('goal_milestones').insert({
        goal_id: goal.id,
        user_id: user.id,
        title: 'Phase 2: Full Objective Realization',
        target_value: 100,
        reward_xp: 150,
        completed: false
      }).select().single();
      if (def1.data) createdMilestones.push(def1.data);
      if (def2.data) createdMilestones.push(def2.data);
    }

    // 3. Activity Log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'GOAL_CREATED',
      module: 'GOALS',
      details: {
        goalId: goal.id,
        title: goal.title,
        category: goal.category
      }
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

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
