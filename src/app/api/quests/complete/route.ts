import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Verify authenticated session server-side
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Valid operator session required.' }, { status: 401 });
    }

    const { questId } = await request.json();
    if (!questId) {
      return NextResponse.json({ error: 'Missing questId parameter.' }, { status: 400 });
    }

    // 2. Fetch target quest owned by user
    const { data: quest, error: questErr } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', user.id)
      .single();

    if (questErr || !quest) {
      return NextResponse.json({ error: 'Quest not found or not owned by user.' }, { status: 404 });
    }

    // 3. Check if already completed (prevent duplicate XP exploits)
    const { data: existingCompletion } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('quest_id', questId)
      .eq('user_id', user.id)
      .single();

    if (existingCompletion) {
      return NextResponse.json({ error: 'Quest already claimed and completed.' }, { status: 400 });
    }

    const xpReward = quest.xp_reward || 50;

    // 4. Record quest completion
    await supabase.from('quest_completions').insert({
      quest_id: questId,
      user_id: user.id,
      xp_awarded: xpReward
    });

    // 5. Update quest status
    await supabase.from('quests').update({
      status: 'COMPLETED',
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', questId).eq('user_id', user.id);

    // 6. Record XP transaction ledger
    await supabase.from('xp_transactions').insert({
      user_id: user.id,
      amount: xpReward,
      source_type: 'QUEST',
      source_id: questId,
      description: `Completed quest: "${quest.title}"`
    });

    // 7. Update player progression
    const { data: progress } = await supabase
      .from('player_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let newCurrentXp = (progress?.current_xp || 0) + xpReward;
    let newTotalXp = (progress?.total_xp || 0) + xpReward;
    let newLevel = progress?.level || 1;
    let nextLevelThreshold = newLevel * 1000;

    if (newCurrentXp >= nextLevelThreshold) {
      newLevel += 1;
      newCurrentXp -= nextLevelThreshold;
    }

    await supabase.from('player_progress').upsert({
      user_id: user.id,
      level: newLevel,
      current_xp: newCurrentXp,
      total_xp: newTotalXp,
      quests_completed: (progress?.quests_completed || 0) + 1,
      last_active_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });

    // 8. Record in activity log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'QUEST_COMPLETED',
      module: 'QUESTS',
      details: {
        quest_id: questId,
        title: quest.title,
        xp_awarded: xpReward,
        new_level: newLevel
      }
    });

    return NextResponse.json({
      success: true,
      xpAwarded: xpReward,
      level: newLevel,
      currentXp: newCurrentXp
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
