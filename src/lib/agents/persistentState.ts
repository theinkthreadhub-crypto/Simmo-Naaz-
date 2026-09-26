import { createClient } from '@/lib/supabase/server';

export type PersistentAgentStatus =
  | 'ACTIVE'
  | 'WAITING_APPROVAL'
  | 'PAUSED'
  | 'COMPLETE'
  | 'FAILED';

export interface PersistentAgentState {
  user_id: string;
  agent_key: string;
  objective: string;
  status: PersistentAgentStatus;
  checkpoint: Record<string, unknown>;
  step_count: number;
  last_error?: string | null;
  next_run_at?: string | null;
  checkpointed_at?: string;
}

export async function loadPersistentAgentState(
  userId: string,
  agentKey: string
): Promise<PersistentAgentState | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agent_runtime_state')
      .select('user_id, agent_key, objective, status, checkpoint, step_count, last_error, next_run_at, checkpointed_at')
      .eq('user_id', userId)
      .eq('agent_key', agentKey)
      .maybeSingle();

    if (error || !data) return null;
    return data as PersistentAgentState;
  } catch {
    return null;
  }
}

export async function checkpointPersistentAgentState(
  state: PersistentAgentState
): Promise<boolean> {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('agent_runtime_state')
      .upsert({
        user_id: state.user_id,
        agent_key: state.agent_key,
        objective: state.objective,
        status: state.status,
        checkpoint: state.checkpoint,
        step_count: state.step_count,
        last_error: state.last_error || null,
        next_run_at: state.next_run_at || null,
        checkpointed_at: now,
        updated_at: now
      }, { onConflict: 'user_id,agent_key' });

    return !error;
  } catch {
    return false;
  }
}
