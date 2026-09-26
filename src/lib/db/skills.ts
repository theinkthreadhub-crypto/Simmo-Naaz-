import { supabase } from '@/lib/supabase/client';
import { SkillNode } from '@/types/mentra';

export async function getUserSkills(userId: string): Promise<SkillNode[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(s => ({
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    category: s.category,
    level: s.level || 1,
    maxLevel: s.target_level || 10,
    currentXp: s.xp || 0,
    nextLevelXp: (s.level || 1) * 300,
    unlocked: s.status !== 'LOCKED',
    status: s.status,
    prerequisites: [],
    description: s.description || '',
    practiceQuests: s.practice_quests || [],
    roadmap: s.roadmap || []
  }));
}
