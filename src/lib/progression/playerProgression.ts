import { createClient } from '@/lib/supabase/server';
import { PlayerProgress, PlayerStats, StatKey, QUEST_REWARD_RULES, QuestDifficulty } from '@/types/mentra';

/**
 * Standard progression curve:
 * Level 1 -> 1000 XP
 * Level 2 -> 2000 XP
 * Level N -> N * 1000 XP
 */
export function xpRequiredForLevel(level: number): number {
  return Math.max(1, level) * 1000;
}

export function calculateLevel(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let remainingXp = Math.max(0, totalXp);

  while (true) {
    const needed = xpRequiredForLevel(level);
    if (remainingXp < needed) {
      return {
        level,
        currentXp: remainingXp,
        nextLevelXp: needed
      };
    }
    remainingXp -= needed;
    level += 1;
  }
}

export interface AddXPResult {
  success: boolean;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  currentXp: number;
  nextLevelXp: number;
  totalXp: number;
  xpAwarded: number;
  error?: string;
}

/**
 * Secure Server-side XP Award with Idempotency & Ledger Transaction Logging
 */
export async function addXPServer(
  userId: string,
  amount: number,
  sourceType: 'QUEST' | 'SKILL_LESSON' | 'SKILL_PRACTICE' | 'JOURNAL' | 'JOURNAL_LOG' | 'MILESTONE' | 'GOAL_MILESTONE' | 'BOSS_MISSION' | 'ACHIEVEMENT' | 'STREAK_BONUS' | 'MANUAL',
  sourceId?: string,
  description?: string,
  skillId?: string
): Promise<AddXPResult> {
  const supabase = createClient();

  if (amount <= 0) {
    return {
      success: false,
      leveledUp: false,
      previousLevel: 1,
      newLevel: 1,
      currentXp: 0,
      nextLevelXp: 1000,
      totalXp: 0,
      xpAwarded: 0,
      error: 'Invalid XP amount'
    };
  }

  const { data: currentProg, error: progressReadError } = await supabase
    .from('player_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (progressReadError) {
    return {
      success: false,
      leveledUp: false,
      previousLevel: 1,
      newLevel: 1,
      currentXp: 0,
      nextLevelXp: 1000,
      totalXp: 0,
      xpAwarded: 0,
      error: 'Unable to read player progression.'
    };
  }

  const prevTotalXp = currentProg?.total_xp || 0;
  const previousCalc = calculateLevel(prevTotalXp);

  const failure = (error: string): AddXPResult => ({
    success: false,
    leveledUp: false,
    previousLevel: previousCalc.level,
    newLevel: previousCalc.level,
    currentXp: previousCalc.currentXp,
    nextLevelXp: previousCalc.nextLevelXp,
    totalXp: prevTotalXp,
    xpAwarded: 0,
    error
  });

  if (sourceId) {
    const { data: existingTx, error: duplicateCheckError } = await supabase
      .from('xp_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .maybeSingle();

    if (duplicateCheckError) {
      return failure('Unable to verify XP idempotency.');
    }
    if (existingTx) {
      return failure('Reward already awarded for this action.');
    }
  }

  const { data: ledgerTx, error: txErr } = await supabase
    .from('xp_transactions')
    .insert({
      user_id: userId,
      amount,
      source_type: sourceType,
      source_id: sourceId || null,
      skill_id: skillId || null,
      description: description || `Awarded +${amount} XP from ${sourceType}`
    })
    .select('id')
    .single();

  if (txErr || !ledgerTx) {
    const duplicate = txErr?.code === '23505';
    if (!duplicate) console.error('[XP LEDGER ERROR]:', txErr?.code || 'UNKNOWN');
    return failure(
      duplicate
        ? 'Reward already awarded for this action.'
        : 'XP ledger write failed; progression was not changed.'
    );
  }

  const newTotalXp = prevTotalXp + amount;
  const newCalc = calculateLevel(newTotalXp);
  const leveledUp = newCalc.level > previousCalc.level;

  const { error: progressWriteError } = await supabase
    .from('player_progress')
    .upsert({
      user_id: userId,
      level: newCalc.level,
      current_xp: newCalc.currentXp,
      total_xp: newTotalXp,
      last_active_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });

  if (progressWriteError) {
    const { error: rollbackError } = await supabase
      .from('xp_transactions')
      .delete()
      .eq('id', ledgerTx.id);

    if (rollbackError) {
      console.error('[XP LEDGER ROLLBACK ERROR]:', rollbackError.code || 'UNKNOWN');
    }
    return failure('Player progression update failed.');
  }

  if (leveledUp) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'LEVEL_UP',
      title: `LEVEL UP! LEVEL ${newCalc.level}`,
      message: `Congratulations Operator! You advanced to Level ${newCalc.level}.`,
      priority: 'URGENT'
    });

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'PLAYER_LEVEL_UP',
      module: 'PROGRESSION',
      details: {
        previousLevel: previousCalc.level,
        newLevel: newCalc.level,
        totalXp: newTotalXp
      }
    });
  }

  return {
    success: true,
    leveledUp,
    previousLevel: previousCalc.level,
    newLevel: newCalc.level,
    currentXp: newCalc.currentXp,
    nextLevelXp: newCalc.nextLevelXp,
    totalXp: newTotalXp,
    xpAwarded: amount
  };
}

/**
 * Server-side Player Stat Increment
 */
export async function updatePlayerStatServer(
  userId: string,
  statKey: StatKey,
  increment: number
): Promise<PlayerStats | null> {
  const supabase = createClient();
  const { data: currentStats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const currentVal = currentStats ? (currentStats[statKey] || 10) : 10;
  const newVal = Math.max(1, currentVal + increment);

  const { data: updated, error } = await supabase
    .from('player_stats')
    .upsert({
      user_id: userId,
      [statKey]: newVal,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !updated) return null;
  return updated as PlayerStats;
}

/**
 * Server-side Streak Calculation & Update
 */
export async function updateStreakServer(userId: string): Promise<{ currentStreak: number; streakBonus: boolean }> {
  const supabase = createClient();
  const { data: progress } = await supabase
    .from('player_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const lastActive = progress?.last_active_date;
  let currentStreak = progress?.current_streak || 1;
  let longestStreak = progress?.longest_streak || 1;
  let streakBonus = false;

  if (lastActive) {
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      currentStreak += 1;
      streakBonus = true;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await supabase.from('player_progress').upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_date: today,
    updated_at: new Date().toISOString()
  });

  return { currentStreak, streakBonus };
}
