import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { checkpointPersistentAgentState } from './persistentState';

export type OperativeCadence = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface OperativeScheduleInput {
  title: string;
  objective: string;
  cadence: OperativeCadence;
  notifyWhen?: string;
  notifyOnEveryRun?: boolean;
  agentKey?: string;
}

function makeAgentKey(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  return `operative:${slug || crypto.randomBytes(4).toString('hex')}`;
}

export async function scheduleOperativeAgent(
  userId: string,
  input: OperativeScheduleInput
): Promise<{ jobId: string; agentKey: string; created: boolean }> {
  const supabase = createClient();
  const agentKey = input.agentKey || makeAgentKey(input.title);
  const deduplicationKey = `agent-schedule:${agentKey}`;
  const firstRun = new Date(Date.now() + 60_000).toISOString();

  const payload = {
    agent_key: agentKey,
    title: input.title.trim(),
    objective: input.objective.trim(),
    notify_when:
      input.notifyWhen?.trim() || 'Notify only on meaningful actionable change.',
    notify_on_every_run: Boolean(input.notifyOnEveryRun)
  };

  const persisted = await checkpointPersistentAgentState({
    user_id: userId,
    agent_key: agentKey,
    objective: payload.objective,
    status: 'ACTIVE',
    checkpoint: {
      title: payload.title,
      notifyWhen: payload.notify_when,
      notifyOnEveryRun: payload.notify_on_every_run,
      createdBy: 'operator',
      createdAt: new Date().toISOString()
    },
    step_count: 0,
    last_error: null,
    next_run_at: firstRun
  });

  if (!persisted) {
    throw new Error('OPERATIVE_STATE_PERSIST_FAILED');
  }

  const { data: existing, error: lookupError } = await supabase
    .from('scheduled_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('deduplication_key', deduplicationKey)
    .in('status', ['SCHEDULED', 'PAUSED', 'CLAIMED', 'RUNNING'])
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from('scheduled_jobs')
      .update({
        type: 'AGENT_SCHEDULE',
        payload,
        recurrence: input.cadence,
        scheduled_for: firstRun,
        next_run_at: firstRun,
        status: 'SCHEDULED',
        attempt_count: 0,
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return { jobId: existing.id, agentKey, created: false };
  }

  const { data: job, error } = await supabase
    .from('scheduled_jobs')
    .insert({
      user_id: userId,
      type: 'AGENT_SCHEDULE',
      payload,
      scheduled_for: firstRun,
      recurrence: input.cadence,
      timezone: 'Asia/Kolkata',
      status: 'SCHEDULED',
      deduplication_key: deduplicationKey,
      next_run_at: firstRun,
      attempt_count: 0
    })
    .select('id')
    .maybeSingle();

  if (!error && job?.id) {
    return { jobId: job.id, agentKey, created: true };
  }

  if (error?.code === '23505') {
    const { data: raced, error: raceError } = await supabase
      .from('scheduled_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('deduplication_key', deduplicationKey)
      .in('status', ['SCHEDULED', 'PAUSED', 'CLAIMED', 'RUNNING'])
      .maybeSingle();

    if (!raceError && raced?.id) {
      return { jobId: raced.id, agentKey, created: false };
    }
  }

  throw new Error(error?.message || 'OPERATIVE_SCHEDULE_CREATE_FAILED');
}
