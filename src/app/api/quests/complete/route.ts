import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addXPServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { questId } = await request.json();
    if (!questId) return NextResponse.json({ error: 'QUEST_ID_REQUIRED' }, { status: 400 });

    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', user.id)
      .single();

    if (questError || !quest) return NextResponse.json({ error: 'QUEST_NOT_FOUND' }, { status: 404 });
    if (quest.status === 'COMPLETED') {
      return NextResponse.json({ error: 'QUEST_ALREADY_COMPLETED' }, { status: 409 });
    }

    const xpReward = Math.max(0, Number(quest.xp_reward || 0));

    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert({ quest_id: questId, user_id: user.id, xp_awarded: xpReward });
    if (completionError) {
      const duplicate = completionError.code === '23505';
      return NextResponse.json(
        { error: duplicate ? 'QUEST_ALREADY_COMPLETED' : completionError.message },
        { status: duplicate ? 409 : 500 }
      );
    }

    const { error: questUpdateError } = await supabase
      .from('quests')
      .update({
        status: 'COMPLETED',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', questId)
      .eq('user_id', user.id);

    if (questUpdateError) throw questUpdateError;

    let xpResult = null;
    if (xpReward > 0) {
      xpResult = await addXPServer(
        user.id,
        xpReward,
        'QUEST',
        questId,
        `Completed quest: ${quest.title}`,
        quest.skill_id || undefined
      );
      if (!xpResult.success && xpResult.error !== 'Reward already awarded for this action.') {
        throw new Error(xpResult.error || 'XP_AWARD_FAILED');
      }
    }

    const { data: progress } = await supabase
      .from('player_progress')
      .select('quests_completed')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase
      .from('player_progress')
      .upsert({
        user_id: user.id,
        quests_completed: Number(progress?.quests_completed || 0) + 1,
        last_active_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      });

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'QUEST_COMPLETED',
      module: 'QUESTS',
      details: { quest_id: questId, title: quest.title, xp_awarded: xpReward }
    });

    return NextResponse.json({ success: true, xpAwarded: xpReward, xpResult });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
