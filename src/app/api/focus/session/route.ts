import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addXPServer } from '@/lib/progression/playerProgression';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, questId, plannedDurationMin, actualDurationMin, reflections } = body;

    if (action === 'START') {
      const planned = Math.max(1, Math.min(240, Number(plannedDurationMin) || 45));
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          quest_id: questId || null,
          planned_duration_min: planned,
          status: 'RUNNING',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Could not start focus session.');
      return NextResponse.json({ success: true, session: data });
    }

    if (action === 'COMPLETE') {
      const actual = Math.max(1, Math.min(240, Number(actualDurationMin) || 1));
      const xpEarned = Math.round(actual * 1.5);

      const { data: running, error: runningError } = await supabase
        .from('focus_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'RUNNING')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runningError) throw runningError;
      if (!running) {
        return NextResponse.json({ success: false, error: 'NO_RUNNING_SESSION' }, { status: 409 });
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          status: 'COMPLETED',
          actual_duration_min: actual,
          reflections: reflections || '',
          xp_earned: xpEarned,
          completed_at: new Date().toISOString()
        })
        .eq('id', running.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Could not complete focus session.');

      const xpResult = await addXPServer(
        user.id,
        xpEarned,
        'MANUAL',
        `focus_${data.id}`,
        `Completed ${actual}-minute focus session`
      );

      if (!xpResult.success) {
        return NextResponse.json(
          { success: false, error: xpResult.error || 'XP_AWARD_FAILED', session: data },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, xpEarned, session: data, xpResult });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
