import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { QUEST_REWARD_RULES, QuestDifficulty } from '@/types/mentra';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, type, difficulty, priority, due_date, requiredAction, skill_id, goal_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    const diff = (difficulty || 'MEDIUM') as QuestDifficulty;
    const rewards = QUEST_REWARD_RULES[diff] || QUEST_REWARD_RULES.MEDIUM;

    const { data: newQuest, error: createErr } = await supabase
      .from('quests')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        category: category || 'PERSONAL_GROWTH',
        type: type || 'DAILY',
        difficulty: diff,
        xp_reward: rewards.xp,
        skill_xp_reward: rewards.skillXp,
        priority: priority || 'MEDIUM',
        due_date: due_date || null,
        required_action: requiredAction || 'Execute priority protocol',
        skill_id: skill_id || null,
        goal_id: goal_id || null,
        status: 'ACTIVE',
        progress_percent: 0
      })
      .select()
      .single();

    if (createErr || !newQuest) {
      return NextResponse.json({ error: createErr?.message || 'Failed to initialize quest.' }, { status: 500 });
    }

    // Activity Log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'QUEST_CREATED',
      module: 'QUESTS',
      details: {
        questId: newQuest.id,
        title: newQuest.title,
        difficulty: diff,
        xpReward: rewards.xp
      }
    });

    return NextResponse.json({
      success: true,
      quest: {
        id: newQuest.id,
        user_id: newQuest.user_id,
        title: newQuest.title,
        description: newQuest.description,
        category: newQuest.category,
        type: newQuest.type,
        difficulty: newQuest.difficulty,
        rewardXp: newQuest.xp_reward,
        rewardCoins: rewards.coins,
        status: newQuest.status,
        progressPercent: newQuest.progress_percent,
        requiredAction: newQuest.required_action,
        priority: newQuest.priority,
        due_date: newQuest.due_date,
        created_at: newQuest.created_at
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
