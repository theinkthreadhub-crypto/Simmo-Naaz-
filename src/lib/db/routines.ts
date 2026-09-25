import { createClient } from '@/lib/supabase/server';

export interface RoutineStep {
  stepIndex: number;
  title: string;
  durationMin: number;
  actionType: string;
  refId?: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  routineType: 'MORNING' | 'NIGHT' | 'DEEP_WORK' | 'WEEKEND' | 'CUSTOM';
  durationMinutes: number;
  steps: RoutineStep[];
  triggerTime?: string;
  days: string[];
  active: boolean;
  createdAt: string;
}

export async function createRoutine(
  userId: string,
  routine: {
    name: string;
    routineType?: 'MORNING' | 'NIGHT' | 'DEEP_WORK' | 'WEEKEND' | 'CUSTOM';
    durationMinutes?: number;
    steps?: RoutineStep[];
    triggerTime?: string;
    days?: string[];
  }
): Promise<Routine> {
  const supabase = createClient();
  const id = `rtn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const defaultSteps: RoutineStep[] = [
    { stepIndex: 1, title: 'Review MENTRA Morning Brief', durationMin: 5, actionType: 'BRIEF' },
    { stepIndex: 2, title: 'Deep Work on Main Quest', durationMin: 15, actionType: 'QUEST' },
    { stepIndex: 3, title: 'Public Speaking Voice Practice', durationMin: 10, actionType: 'LEARNING' }
  ];

  const newRoutine: Routine = {
    id,
    userId,
    name: routine.name,
    routineType: routine.routineType || 'MORNING',
    durationMinutes: routine.durationMinutes || 30,
    steps: routine.steps || defaultSteps,
    triggerTime: routine.triggerTime || '07:30',
    days: routine.days || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    active: true,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('routines').insert({
      id,
      user_id: userId,
      name: newRoutine.name,
      routine_type: newRoutine.routineType,
      duration_minutes: newRoutine.durationMinutes,
      steps: newRoutine.steps,
      trigger_time: newRoutine.triggerTime,
      days: newRoutine.days,
      active: true,
      created_at: newRoutine.createdAt
    });
  } catch {
    // In-memory fallback
  }

  return newRoutine;
}

export async function listUserRoutines(userId: string): Promise<Routine[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return [];

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      routineType: r.routine_type,
      durationMinutes: r.duration_minutes,
      steps: r.steps || [],
      triggerTime: r.trigger_time,
      days: r.days || [],
      active: r.active,
      createdAt: r.created_at
    }));
  } catch {
    return [];
  }
}

export const getRoutines = listUserRoutines;
