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
): Promise<{ jobId: string | null; agentKey: string; created: boolean }> {
  const supabase = createClient();
  const agentKey = input.agentKey || makeAgentKey(input.title);
  const deduplicationKey = `agent-schedule:${agentKey}`;
  const firstRun = new Date(Date.now() + 60_000).toISOString();

  await checkpointPersistentAgentState({
    user_id: userId,
    agent_key: agentKey,
    objective: input.objective,
    status: 'ACTIVE',
    checkpoint: {
      title: input.title,
      notifyWhen: input.notifyWhen || 'Notify only on meaningful change.',
      createdBy: 'operator'
    },
    step_count: 0,
    next_run_at: firstRun
  });

  const payload = {
    agent_key: agentKey,
    title: input.title,
    objective: input.objective,
    notify_when: input.notifyWhen || 'Notify only on meaningful change.',
    notify_on_every_run: Boolean(input.notifyOnEveryRun)
  };

  const { data: existing } = await supabase
    .from('scheduled_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('deduplication_key', deduplicationKey)
    .in('status', ['SCHEDULED', 'PAUSED', 'CLAIMED'])
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('scheduled_jobs')
      .update({
        type: 'AGENT_SCHEDULE',
        payload,
        recurrence: input.cadence,
        scheduled_for: firstRun,
        next_run_at: firstRun,
        status: 'SCHEDULED',
        attempt_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('user_id', userId);

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
      next_run_at: firstRun
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { jobId: job?.id || null, agentKey, created: true };
}
