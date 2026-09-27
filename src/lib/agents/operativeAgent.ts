import { runMentra } from '@/lib/ai/core';
import {
  checkpointPersistentAgentState,
  loadPersistentAgentState
} from './persistentState';

export interface OperativeTickPayload {
  agent_key?: string;
  title?: string;
  objective?: string;
  notify_when?: string;
  notify_on_every_run?: boolean;
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
  const notifyWhen =
    payload.notify_when || 'Notify only on meaningful actionable change.';

  const previous = await loadPersistentAgentState(userId, agentKey);
  const previousConversationId =
    typeof previous?.checkpoint?.conversationId === 'string'
      ? previous.checkpoint.conversationId
      : undefined;

  const monitorPrompt = [
    'This is a scheduled MENTRA Operative monitor tick.',
    `Objective: ${objective}`,
    `Notification condition: ${notifyWhen}`,
    'Use available tools to verify current state. Never invent a change.',
    'Return [NO_ALERT] when the notification condition is not met.',
    'Return [ALERT] only when verified evidence shows the condition is met or a meaningful actionable change occurred.',
    'Do not return both markers.'
  ].join('\n');

  const result = await runMentra({
    userId,
    channel: 'API',
    text: monitorPrompt,
    timestamp: new Date().toISOString(),
    conversationId: previousConversationId
  });

  if (!result.success) {
    const errorMessage =
      result.error || result.message || 'OPERATIVE_AGENT_RUN_FAILED';

    await checkpointPersistentAgentState({
      user_id: userId,
      agent_key: agentKey,
      objective,
      status: 'FAILED',
      checkpoint: {
        ...(previous?.checkpoint || {}),
        title: payload.title || previous?.checkpoint?.title || agentKey,
        notifyWhen,
        lastRunAt: new Date().toISOString()
      },
      step_count: (previous?.step_count || 0) + 1,
      last_error: errorMessage,
      next_run_at: previous?.next_run_at || null
    });

    throw new Error(errorMessage);
  }

  const raw = result.message || '';
  const explicitNoAlert = raw.includes('[NO_ALERT]');
  const explicitAlert = raw.includes('[ALERT]');

  const shouldNotify =
    Boolean(payload.notify_on_every_run) ||
    (explicitAlert && !explicitNoAlert);

  const cleanMessage = raw
    .replace(/\[(NO_ALERT|ALERT)\]/g, '')
    .trim();

  await checkpointPersistentAgentState({
    user_id: userId,
    agent_key: agentKey,
    objective,
    status: 'ACTIVE',
    checkpoint: {
      ...(previous?.checkpoint || {}),
      title: payload.title || previous?.checkpoint?.title || agentKey,
      notifyWhen,
      notifyOnEveryRun: Boolean(payload.notify_on_every_run),
      conversationId: result.conversationId,
      lastOutput: cleanMessage.slice(0, 3000),
      lastShouldNotify: shouldNotify,
      lastRunAt: new Date().toISOString()
    },
    step_count: (previous?.step_count || 0) + 1,
    last_error: null,
    next_run_at: previous?.next_run_at || null
  });

  return {
    message:
      cleanMessage ||
      'Operative monitor completed with no reportable change.',
    shouldNotify,
    conversationId: result.conversationId
  };
}
