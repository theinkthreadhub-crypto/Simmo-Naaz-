import { supabase } from '@/lib/supabase/client';
import { SkillNode } from '@/types/mentra';

const defaultSeedSkills: Omit<SkillNode, 'id'>[] = [
  {
    name: 'Growth & Performance Marketing',
    category: 'BUSINESS',
    level: 1,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'Paid ads optimization, creative testing, ROAS attribution, and funnel science.',
    practiceQuests: ['Analyze ad creative hook drop-off', 'Audit Meta campaign CBO allocation'],
    roadmap: ['Basic ROAS Attribution', 'Creative Angle Scaling', 'Omnichannel Retargeting']
  },
  {
    name: 'Deal Negotiation & Sales',
    category: 'BUSINESS',
    level: 1,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'B2B outreach, high-ticket persuasion, supplier terms negotiation.',
    practiceQuests: ['Negotiate 10% lower bulk price', 'Draft enterprise outreach script'],
    roadmap: ['Value Hypothesis', 'Objection Inversion', 'Closing Frameworks']
  },
  {
    name: 'AI Agent Architecture',
    category: 'AI',
    level: 1,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'Autonomous state machines, permission-gated execution, and distributed agent coordination.',
    practiceQuests: ['Implement approval-gated tool dispatcher', 'Build vector memory retrieval pipeline'],
    roadmap: ['State Machine Foundations', 'Human-in-the-Loop Gates', 'Distributed Orchestration']
  },
  {
    name: 'Cash Flow & Capital Allocation',
    category: 'FINANCE',
    level: 1,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'Working capital management, runway forecasting, unit economics control.',
    practiceQuests: ['Audit monthly recurring subscriptions', 'Model 90-day cash buffer'],
    roadmap: ['Unit Economics Ledger', 'Working Capital Buffer', 'Strategic Capital Allocation']
  }
];

export async function getUserSkills(userId: string): Promise<SkillNode[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('level', { ascending: false });

  if (error || !data || data.length === 0) {
    return defaultSeedSkills.map((s, idx) => ({
      id: `seed_skill_${idx}`,
      user_id: userId,
      ...s
    }));
  }

  return data.map(s => ({
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
    description: s.description || 'Mastery skill track in MENTRA matrix.',
    practiceQuests: s.practice_quests || [],
    roadmap: s.roadmap || []
  }));
}
