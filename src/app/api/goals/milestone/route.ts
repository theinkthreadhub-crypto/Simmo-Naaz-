import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addXPServer } from '@/lib/progression/playerProgression';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const body = await req.json();
    const milestoneId = typeof body.milestoneId === 'string' ? body.milestoneId : '';
    if (!milestoneId) return NextResponse.json({ error: 'MILESTONE_ID_REQUIRED' }, { status: 400 });

    const { data: milestone, error: milestoneError } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('user_id', user.id)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json({ error: 'MILESTONE_NOT_FOUND' }, { status: 404 });
    }

    const completed = typeof body.completed === 'boolean' ? body.completed : !Boolean(milestone.completed);

    const { error: updateError } = await supabase
      .from('goal_milestones')
      .update({
        completed,
        current_value: completed ? milestone.target_value : 0
      })
      .eq('id', milestoneId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    const { data: all, error: allError } = await supabase
      .from('goal_milestones')
      .select('id, completed')
      .eq('goal_id', milestone.goal_id)
      .eq('user_id', user.id);

    if (allError) throw allError;

    const total = all?.length || 0;
    const completedCount = (all || []).filter(item =>
      item.id === milestoneId ? completed : Boolean(item.completed)
    ).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const { error: goalError } = await supabase
      .from('goals')
      .update({
        current_value: progressPercent,
        status: progressPercent === 100 ? 'ACHIEVED' : 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', milestone.goal_id)
      .eq('user_id', user.id);

    if (goalError) throw goalError;

    let xpResult = null;
    if (completed && !milestone.completed && Number(milestone.reward_xp || 0) > 0) {
      xpResult = await addXPServer(
        user.id,
        Number(milestone.reward_xp),
        'GOAL_MILESTONE',
        milestone.id,
        `Completed goal milestone: ${milestone.title}`
      );
    }

    return NextResponse.json({
      success: true,
      milestoneId,
      completed,
      progressPercent,
      goalStatus: progressPercent === 100 ? 'ACHIEVED' : 'IN_PROGRESS',
      xpResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
