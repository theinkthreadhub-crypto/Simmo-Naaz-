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
    payload.notify_when || 'Notify only on meaningful change.';

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
    Boolean(payload.notify_on_every_run) ||
    (explicitAlert && !explicitNoAlert);
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
    message:
      cleanMessage ||
      'Operative monitor completed with no reportable change.',
    shouldNotify,
    conversationId: result.conversationId
  };
}
