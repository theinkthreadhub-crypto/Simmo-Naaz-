import { createClient } from '@/lib/supabase/server';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  lifeArea: string;
  frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'CUSTOM';
  targetCount: number;
  preferredTime?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  relatedGoalId?: string;
  relatedSkillId?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  xpReward: number;
  currentStreak?: number;
  completedToday?: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completionDate: string;
  completedAt: string;
  notes?: string;
  source: string;
  xpAwarded: number;
}

const memHabits = new Map<string, Habit>();
const memCompletions = new Set<string>(); // key: `${habitId}_${date}`

export async function createHabit(
  userId: string,
  habit: {
    title: string;
    description?: string;
    lifeArea?: string;
    frequency?: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'CUSTOM';
    targetCount?: number;
    preferredTime?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    relatedGoalId?: string;
    relatedSkillId?: string;
    xpReward?: number;
  }
): Promise<Habit> {
  const id = `hab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newHabit: Habit = {
    id,
    userId,
    title: habit.title,
    description: habit.description || '',
    lifeArea: habit.lifeArea || 'Personal Growth',
    frequency: habit.frequency || 'DAILY',
    targetCount: habit.targetCount || 1,
    preferredTime: habit.preferredTime || 'MORNING',
    difficulty: habit.difficulty || 'MEDIUM',
    relatedGoalId: habit.relatedGoalId,
    relatedSkillId: habit.relatedSkillId,
    status: 'ACTIVE',
    xpReward: habit.xpReward || 15,
    createdAt: new Date().toISOString()
  };

  memHabits.set(id, newHabit);

  Promise.resolve().then(async () => {
    try {
      const supabase = createClient();
      await supabase.from('habits').insert({
        id,
        user_id: userId,
        title: newHabit.title,
        description: newHabit.description,
        life_area: newHabit.lifeArea,
        frequency: newHabit.frequency,
        target_count: newHabit.targetCount,
        preferred_time: newHabit.preferredTime,
        difficulty: newHabit.difficulty,
        related_goal_id: newHabit.relatedGoalId || null,
        related_skill_id: newHabit.relatedSkillId || null,
        status: 'ACTIVE',
        xp_reward: newHabit.xpReward,
        created_at: newHabit.createdAt
      });
    } catch {
      // Offline fallback
    }
  });

  return newHabit;
}

export async function completeHabitToday(
  userId: string,
  habitId: string,
  source: string = 'WEB'
): Promise<{ success: boolean; message: string; xpAwarded: number }> {
  const today = new Date().toISOString().split('T')[0];
  const compKey = `${habitId}_${today}`;

  if (memCompletions.has(compKey)) {
    return { success: false, message: 'Habit already completed today.', xpAwarded: 0 };
  }

  const habit = memHabits.get(habitId);
  const xpReward = habit?.xpReward || 15;

  memCompletions.add(compKey);

  Promise.resolve().then(async () => {
    try {
      const supabase = createClient();
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: userId,
        completion_date: today,
        completed_at: new Date().toISOString(),
        source,
        xp_awarded: xpReward
      });

      await supabase.rpc('increment_player_xp', { p_user_id: userId, p_xp: xpReward });
    } catch {
      // Offline fallback
    }
  });

  return {
    success: true,
    message: `Habit completed! +${xpReward} XP awarded.`,
    xpAwarded: xpReward
  };
}

export async function listUserHabits(userId: string): Promise<Habit[]> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const supabase = createClient();
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (habits && habits.length > 0) {
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id')
        .eq('user_id', userId)
        .eq('completion_date', today);

      const completedIds = new Set((completions || []).map((c: any) => c.habit_id));

      return habits.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        title: h.title,
        description: h.description,
        lifeArea: h.life_area,
        frequency: h.frequency,
        targetCount: h.target_count,
        preferredTime: h.preferred_time,
        difficulty: h.difficulty,
        relatedGoalId: h.related_goal_id,
        relatedSkillId: h.related_skill_id,
        status: h.status,
        xpReward: h.xp_reward,
        completedToday: completedIds.has(h.id),
        createdAt: h.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Habit[] = [];
  memHabits.forEach((h) => {
    if (h.userId === userId) {
      list.push({
        ...h,
        completedToday: memCompletions.has(`${h.id}_${today}`)
      });
    }
  });
  return list;
}

export const getHabits = listUserHabits;
export const completeHabit = (habitId: string, userId: string, source: string = 'WEB') =>
  completeHabitToday(userId, habitId, source);
