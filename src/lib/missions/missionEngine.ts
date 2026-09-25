import { createClient } from '@/lib/supabase/server';
import { createAutonomousPlan } from '../planner/planEngine';
import { SovereignPlan } from '../planner/types';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  xpReward: number;
}

export interface SovereignMission {
  id: string;
  userId: string;
  title: string;
  objective: string;
  timelineDays: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  milestones: Milestone[];
  totalXp: number;
  plan?: SovereignPlan;
  createdAt: string;
  updatedAt: string;
}

export async function createMission(
  userId: string,
  title: string,
  objective: string,
  timelineDays: number = 7
): Promise<SovereignMission> {
  const supabase = createClient();
  const missionId = `msn_${Date.now()}`;

  const milestones: Milestone[] = [
    { id: 'm1', title: 'Intelligence & Market Baseline', completed: false, xpReward: 50 },
    { id: 'm2', title: 'Financial & Resource Budgeting', completed: false, xpReward: 50 },
    { id: 'm3', title: 'Execution Roadmap & Quests', completed: false, xpReward: 75 },
    { id: 'm4', title: 'Launch & Operational Synthesis', completed: false, xpReward: 125 }
  ];

  const totalXp = milestones.reduce((sum, m) => sum + m.xpReward, 0);

  const plan = await createAutonomousPlan(userId, objective, 'ASSISTED', missionId);

  const mission: SovereignMission = {
    id: missionId,
    userId,
    title,
    objective,
    timelineDays,
    status: 'ACTIVE',
    milestones,
    totalXp,
    plan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await supabase.from('missions').insert({
      id: missionId,
      user_id: userId,
      title,
      objective,
      timeline_days: timelineDays,
      status: 'ACTIVE',
      milestones,
      total_xp: totalXp,
      created_at: mission.createdAt,
      updated_at: mission.updatedAt
    });
  } catch {
    // In-memory / test harness
  }

  return mission;
}

export async function listUserMissions(userId: string): Promise<SovereignMission[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      objective: d.objective,
      timelineDays: d.timeline_days,
      status: d.status,
      milestones: d.milestones || [],
      totalXp: d.total_xp,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  } catch {
    return [];
  }
}
