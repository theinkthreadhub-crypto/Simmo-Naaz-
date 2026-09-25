import { supabase } from '@/lib/supabase/client';
import { Profile, PlayerProgress, PlayerStats } from '@/types/mentra';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getPlayerProgress(userId: string): Promise<PlayerProgress | null> {
  const { data, error } = await supabase
    .from('player_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as PlayerProgress;
}

export async function getPlayerStats(userId: string): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as PlayerStats;
}

export async function initializeUserProfile(
  userId: string,
  displayName: string,
  primaryGoal: string,
  priorities: string[]
): Promise<{ profile: Profile; progress: PlayerProgress; stats: PlayerStats }> {
  // 1. Create or update profile
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      display_name: displayName,
      primary_goal: primaryGoal,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileErr) throw profileErr;

  // 2. Initialize default Player Progress (Level 1, 0 XP, 1-Day Streak)
  const { data: progressData, error: progressErr } = await supabase
    .from('player_progress')
    .upsert({
      user_id: userId,
      level: 1,
      current_xp: 0,
      total_xp: 0,
      current_streak: 1,
      longest_streak: 1,
      quests_completed: 0,
      last_active_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (progressErr) throw progressErr;

  // 3. Initialize default Player Stats
  const baseStat = 15;
  const { data: statsData, error: statsErr } = await supabase
    .from('player_stats')
    .upsert({
      user_id: userId,
      discipline: priorities.includes('Discipline') ? 25 : baseStat,
      focus: priorities.includes('Focus') ? 25 : baseStat,
      knowledge: priorities.includes('Learning') ? 25 : baseStat,
      business: priorities.includes('Business') ? 25 : baseStat,
      finance: priorities.includes('Money') ? 25 : baseStat,
      communication: priorities.includes('Communication') ? 25 : baseStat,
      fitness: priorities.includes('Fitness') ? 25 : baseStat,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (statsErr) throw statsErr;

  return {
    profile: profileData as Profile,
    progress: progressData as PlayerProgress,
    stats: statsData as PlayerStats
  };
}
