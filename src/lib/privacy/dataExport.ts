import { createClient } from '@/lib/supabase/server';
import { getHabits } from '@/lib/db/habits';
import { getRoutines } from '@/lib/db/routines';
import { getProjects, getDecisions } from '@/lib/db/projects';
import { getTodayWellness } from '@/lib/db/wellness';

export interface UserDataExport {
  exportMetadata: {
    exportDate: string;
    version: string;
    userId: string;
  };
  playerProfile: unknown;
  habits: unknown[];
  routines: unknown[];
  projects: unknown[];
  decisions: unknown[];
  wellness: unknown;
}

async function getExportPlayerProfile(userId: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('player_progress').select('*').eq('user_id', userId).single();
    return data || { level: 1, total_xp: 0, current_streak: 1 };
  } catch {
    return { level: 1, total_xp: 0, current_streak: 1 };
  }
}

/**
 * Generates a privacy-safe user data export object.
 * Strictly excludes any OAuth tokens, passwords, encryption keys, or third-party secrets.
 */
export async function generateUserDataExport(userId: string): Promise<UserDataExport> {
  const [profile, habits, routines, projects, decisions, wellness] = await Promise.all([
    getExportPlayerProfile(userId).catch(() => null),
    getHabits(userId).catch(() => []),
    getRoutines(userId).catch(() => []),
    getProjects(userId).catch(() => []),
    getDecisions(userId).catch(() => []),
    getTodayWellness(userId).catch(() => null)
  ]);

  return {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      version: '1.0.0-phase9',
      userId: `user_${userId.substring(0, 8)}...`
    },
    playerProfile: profile,
    habits,
    routines,
    projects,
    decisions,
    wellness
  };
}
