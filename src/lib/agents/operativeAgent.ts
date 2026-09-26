import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { runMentra } from '@/lib/ai/core';
import { checkpointPersistentAgentState, loadPersistentAgentState } from './persistentState';

export type OperativeCadence = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface OperativeScheduleInput {
  title: string;
  objective: string;
  cadence: OperativeCadence;
  notifyWhen?: string;
  notifyOnEveryRun?: boolean;
  agentKey?: string;
}

export interface OperativeTickPayload {
  agent_key?: string;
  title?: string;
  objective?: string;
  notify_when?: string;
  notify_on_every_run?: boolean;
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

export async function runOperativeAgentTick(
  userId: string,
  payload: OperativeTickPayload
): Promise<{ message: string; shouldNotify: boolean; conversationId: string }> {
  const agentKey = payload.agent_key || 'operative:scheduled';
  const objective =
    payload.objective ||
    payload.title ||
    'Review current operator state and report meaningful changes.';
  const notifyWhen = payload.notify_when || 'Notify only on meaningful change.';

  const previous = await loadPersistentAgentState(userId, agentKey);
  const previousConversationId =
    typeof previous?.checkpoint?.conversationId === 'string'
      ? previous.checkpoint.conversationId
      : undefined;

  const monitorPrompt = [
    'This is a scheduled MENTRA Operative/Monitor tick.',
    `Objective: ${objective}`,
    `Notification condition: ${notifyWhen}`,
    'Use available tools to verify current state. Do not invent changes.',
    'If the notification condition is NOT met, include [NO_ALERT] in the final answer.',
    'If the condition IS met or there is a meaningful actionable change, include [ALERT] in the final answer.'
  ].join('\n');

  const result = await runMentra({
    userId,
    channel: 'API',
    text: monitorPrompt,
    timestamp: new Date().toISOString(),
    conversationId: previousConversationId
  });

  const raw = result.message || '';
  const explicitNoAlert = raw.includes('[NO_ALERT]');
  const explicitAlert = raw.includes('[ALERT]');
  const shouldNotify =
    Boolean(payload.notify_on_every_run) || (explicitAlert && !explicitNoAlert);
  const cleanMessage = raw.replace(/\[(NO_ALERT|ALERT)\]/g, '').trim();

  await checkpointPersistentAgentState({
    user_id: userId,
    agent_key: agentKey,
    objective,
    status: 'ACTIVE',
    checkpoint: {
      conversationId: result.conversationId,
      lastOutput: cleanMessage.slice(0, 3000),
      lastShouldNotify: shouldNotify,
      lastRunAt: new Date().toISOString()
    },
    step_count: (previous?.step_count || 0) + 1
  });

  return {
    message: cleanMessage || 'Operative monitor completed with no reportable change.',
    shouldNotify,
    conversationId: result.conversationId
  };
}
