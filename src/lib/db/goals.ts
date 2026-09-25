import { supabase } from '@/lib/supabase/client';
import { Goal, GoalMilestone } from '@/types/mentra';

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const { data: goalsData, error } = await supabase
    .from('goals')
    .select('*, goal_milestones(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !goalsData) return [];

  return goalsData.map(g => ({
    id: g.id,
    user_id: g.user_id,
    title: g.title,
    description: g.description || '',
    category: g.category,
    target_value: g.target_value,
    current_value: g.current_value,
    unit: g.unit,
    start_date: g.start_date,
    targetDate: g.target_date,
    target_date: g.target_date,
    priority: g.priority,
    progressPercent: g.target_value ? Math.min(100, Math.round(((g.current_value || 0) / g.target_value) * 100)) : 0,
    status: g.status,
    milestones: (g.goal_milestones || []).map((m: any) => ({
      id: m.id,
      goal_id: m.goal_id,
      title: m.title,
      targetValue: m.target_value,
      currentValue: m.current_value,
      unit: m.unit,
      completed: m.completed,
      rewardXp: m.reward_xp
    })),
    created_at: g.created_at
  }));
}

export async function createGoal(userId: string, goal: Partial<Goal>): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'BUSINESS',
      target_value: goal.target_value || 100,
      current_value: goal.current_value || 0,
      unit: goal.unit || '%',
      target_date: goal.targetDate || goal.target_date || null,
      priority: goal.priority || 'MEDIUM',
      status: 'IN_PROGRESS'
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
    targetDate: data.target_date,
    progressPercent: 0,
    milestones: [],
    status: data.status,
    created_at: data.created_at
  };
}

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  currentValue: number
): Promise<boolean> {
  const { error } = await supabase
    .from('goals')
    .update({ current_value: currentValue })
    .eq('id', goalId)
    .eq('user_id', userId);

  return !error;
}
