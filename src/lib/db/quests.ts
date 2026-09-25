import { supabase } from '@/lib/supabase/client';
import { Quest } from '@/types/mentra';

export async function getUserQuests(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(q => ({
    id: q.id,
    user_id: q.user_id,
    title: q.title,
    description: q.description,
    category: q.category,
    type: q.type,
    difficulty: q.difficulty,
    rewardXp: q.xp_reward,
    rewardCoins: Math.floor(q.xp_reward * 0.6),
    status: q.status,
    progressPercent: q.progress_percent || 0,
    requiredAction: q.required_action,
    priority: q.priority,
    due_date: q.due_date,
    completed_at: q.completed_at,
    created_at: q.created_at,
    updated_at: q.updated_at
  }));
}

export async function createQuest(userId: string, quest: Partial<Quest>): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .insert({
      user_id: userId,
      title: quest.title,
      description: quest.description || '',
      category: quest.category || 'PERSONAL_GROWTH',
      type: quest.type || 'DAILY',
      difficulty: quest.difficulty || 'MEDIUM',
      xp_reward: quest.rewardXp || 50,
      priority: quest.priority || 'MEDIUM',
      required_action: quest.requiredAction || '',
      status: 'ACTIVE',
      progress_percent: 0,
      due_date: quest.due_date || null
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    category: data.category,
    type: data.type,
    difficulty: data.difficulty,
    rewardXp: data.xp_reward,
    rewardCoins: Math.floor(data.xp_reward * 0.6),
    status: data.status,
    progressPercent: data.progress_percent || 0,
    requiredAction: data.required_action,
    created_at: data.created_at
  };
}

export async function completeUserQuest(userId: string, questId: string): Promise<boolean> {
  const { error } = await supabase
    .from('quests')
    .update({
      status: 'COMPLETED',
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', questId)
    .eq('user_id', userId);

  return !error;
}
