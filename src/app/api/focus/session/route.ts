import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          quest_id: questId || null,
          planned_duration_min: plannedDurationMin || 45,
          status: 'RUNNING',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, session: data });
    }

    if (action === 'COMPLETE') {
      const xpEarned = Math.round((actualDurationMin || 45) * 1.5);
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          status: 'COMPLETED',
          actual_duration_min: actualDurationMin || 45,
          reflections: reflections || '',
          xp_earned: xpEarned,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'RUNNING')
        .select()
        .single();

      if (!error && data) {
        try {
          await supabase.rpc('increment_player_xp', { p_user_id: user.id, p_xp: xpEarned });
        } catch {
          // Fallback
        }
      }

      return NextResponse.json({ success: true, xpEarned, session: data });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
