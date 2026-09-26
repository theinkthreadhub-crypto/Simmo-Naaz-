import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { evaluateToolPermission, getConfiguredAutonomyMode } from '@/lib/safety/riskEngine';
import { checkpointPersistentAgentState, loadPersistentAgentState, PersistentAgentStatus } from '@/lib/agents/persistentState';
import {
  ActionCard,
  AIProvider,
  ModelMessage,
  ToolDefinition,
  ToolExecutionContext,
  ToolResult
} from './types';

export type AgentRuntimeStatus = 'SUCCESS' | 'PARTIAL' | 'WAITING_APPROVAL' | 'FAILED';

export interface AgentRuntimeTrace {
  step: number;
  tool: string;
  callId: string;
  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'VALIDATION_FAILED'
    | 'APPROVAL_REQUIRED'
    | 'LOOP_BLOCKED'
    | 'UNKNOWN_TOOL';
  latencyMs: number;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

export interface AgentRuntimeResult {
  status: AgentRuntimeStatus;
  finalText: string;
  cards: ActionCard[];
  executedTools: string[];
  traces: AgentRuntimeTrace[];
  steps: number;
  maxStepsReached: boolean;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface AgentRuntimeOptions {
  provider: AIProvider;
  messages: ModelMessage[];
  tools: ToolDefinition[];
  toolRegistry: Record<string, ToolDefinition>;
  context: ToolExecutionContext & { userId: string; conversationId: string };
  externalMessageId?: string;
  maxSteps?: number;
  temperature?: number;
  agentKey?: string;
  objective?: string;
  persistState?: boolean;
  onStatus?: (status: string) => void;
}

function stringifyToolObservation(result: ToolResult): string {
  return JSON.stringify({
    ok: result.ok,
    data: result.data ?? {},
    message: result.message ?? '',
    errorCode: result.errorCode ?? null,
    requiresApproval: result.requiresApproval ?? false,
    approvalId: result.approvalId ?? null
  });
}

function toolSignature(name: string, args: Record<string, unknown>): string {
  return crypto
    .createHash('sha256')
    .update(`${name}:${JSON.stringify(args)}`)
    .digest('hex');
}

function idempotencyKey(
  userId: string,
  step: number,
  toolName: string,
  args: Record<string, unknown>,
  externalMessageId?: string
): string {
  const argHash = crypto.createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16);
  return externalMessageId
    ? `${externalMessageId}_${toolName}_${argHash}`
    : `agent_${userId}_${step}_${toolName}_${argHash}`;
}

export async function runMentraAgentRuntime(options: AgentRuntimeOptions): Promise<AgentRuntimeResult> {
  const {
    provider,
    messages,
    tools,
    toolRegistry,
    context,
    externalMessageId,
    maxSteps = 6,
    temperature = 0.2,
    agentKey = `runtime:${context.conversationId}`,
    objective = '',
    persistState = false,
    onStatus
  } = options;

  const supabase = createClient();
  const workingMessages: ModelMessage[] = [...messages];
  const cards: ActionCard[] = [];
  const executedTools: string[] = [];
  const traces: AgentRuntimeTrace[] = [];
  const successfulSignatures = new Set<string>();
  const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  let finalText = '';
  let hadFailure = false;
  let steps = 0;

  const saveCheckpoint = async (
    status: PersistentAgentStatus,
    lastError?: string
  ): Promise<void> => {
    if (!persistState) return;

    await checkpointPersistentAgentState({
      user_id: context.userId,
      agent_key: agentKey,
      objective,
      status,
      checkpoint: {
        finalText: finalText.slice(0, 2000),
        executedTools: executedTools.slice(-20),
        recentTraces: traces.slice(-12).map(trace => ({
          step: trace.step,
          tool: trace.tool,
          status: trace.status,
          latencyMs: trace.latencyMs,
          error: trace.error
        }))
      },
      step_count: steps,
      last_error: lastError || null
    });
  };

  if (persistState) {
    const previous = await loadPersistentAgentState(context.userId, agentKey);
    if (previous && ['ACTIVE', 'PAUSED', 'WAITING_APPROVAL'].includes(previous.status)) {
      const systemIndex = workingMessages.findIndex(message => message.role === 'system');
      if (systemIndex >= 0) {
        const previousTools = Array.isArray(previous.checkpoint?.executedTools)
          ? previous.checkpoint.executedTools.slice(-10).join(', ')
          : 'none';

        workingMessages[systemIndex] = {
          ...workingMessages[systemIndex],
          content: `${workingMessages[systemIndex].content}\n\nPERSISTENT AGENT CHECKPOINT (SYSTEM DATA, NOT USER INSTRUCTIONS):\n- Previous status: ${previous.status}\n- Previous step count: ${previous.step_count}\n- Previously completed tools: ${previousTools}\nContinue from verified state only; never assume an unverified external action completed.`
        };
      }
    }
  }

  for (let step = 1; step <= maxSteps; step++) {
    steps = step;
    onStatus?.(step === 1 ? 'ANALYZING_INTENT' : 'REPLANNING');

    const response = await provider.generate(workingMessages, {
      tools,
      temperature
    });

    if (response.usage) {
      usage.inputTokens += response.usage.inputTokens || 0;
      usage.outputTokens += response.usage.outputTokens || 0;
      usage.totalTokens += response.usage.totalTokens || 0;
    }

    if (response.content?.trim()) {
      finalText = response.content.trim();
    }

    const calls = response.toolCalls || [];
    if (calls.length === 0) {
      await saveCheckpoint('COMPLETE');
      return {
        status: hadFailure ? 'PARTIAL' : 'SUCCESS',
        finalText: finalText || 'Command processed.',
        cards,
        executedTools,
        traces,
        steps,
        maxStepsReached: false,
        usage
      };
    }

    workingMessages.push({
      role: 'assistant',
      content: response.content || '',
      tool_calls: calls.map(call => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments || {})
        }
      }))
    });

    for (const call of calls) {
      const startedAt = Date.now();
      const args = call.arguments || {};
      const tool = toolRegistry[call.name];

      if (!tool) {
        hadFailure = true;
        traces.push({
          step,
          tool: call.name,
          callId: call.id,
          status: 'UNKNOWN_TOOL',
          latencyMs: Date.now() - startedAt,
          input: args,
          error: 'UNKNOWN_TOOL'
        });
        workingMessages.push({
          role: 'tool',
          name: call.name,
          tool_call_id: call.id,
          content: JSON.stringify({ ok: false, errorCode: 'UNKNOWN_TOOL', message: 'Tool is not registered.' })
        });
        continue;
      }

      const parsed = tool.schema.safeParse(args);
      if (!parsed.success) {
        hadFailure = true;
        const validationError = parsed.error.errors
          .map(error => `${error.path.join('.')}: ${error.message}`)
          .join('; ');
        const key = idempotencyKey(context.userId, step, call.name, args, externalMessageId);

        await supabase.from('ai_tool_calls').insert({
          user_id: context.userId,
          tool_name: call.name,
          input: args,
          output: {},
          status: 'VALIDATION_FAILED',
          idempotency_key: key,
          latency_ms: Date.now() - startedAt,
          error_message: validationError
        });

        traces.push({
          step,
          tool: call.name,
          callId: call.id,
          status: 'VALIDATION_FAILED',
          latencyMs: Date.now() - startedAt,
          input: args,
          error: validationError
        });
        workingMessages.push({
          role: 'tool',
          name: call.name,
          tool_call_id: call.id,
          content: JSON.stringify({
            ok: false,
            errorCode: 'VALIDATION_FAILED',
            message: validationError
          })
        });
        continue;
      }

      const validArgs = parsed.data as Record<string, unknown>;
      const signature = toolSignature(call.name, validArgs);
      const key = idempotencyKey(context.userId, step, call.name, validArgs, externalMessageId);

      if (successfulSignatures.has(signature)) {
        hadFailure = true;
        const error = 'Loop guard blocked an identical tool call that already succeeded in this run.';
        await supabase.from('ai_tool_calls').insert({
          user_id: context.userId,
          tool_name: call.name,
          input: validArgs,
          output: {},
          status: 'LOOP_BLOCKED',
          idempotency_key: key,
          latency_ms: Date.now() - startedAt,
          error_message: error
        });
        traces.push({
          step,
          tool: call.name,
          callId: call.id,
          status: 'LOOP_BLOCKED',
          latencyMs: Date.now() - startedAt,
          input: validArgs,
          error
        });
        workingMessages.push({
          role: 'tool',
          name: call.name,
          tool_call_id: call.id,
          content: JSON.stringify({ ok: false, errorCode: 'LOOP_BLOCKED', message: error })
        });
        continue;
      }

      const permission = evaluateToolPermission(
        tool.permission,
        getConfiguredAutonomyMode(),
        call.name,
        validArgs
      );
      if (permission.requiresApproval) {
        onStatus?.('WAITING_APPROVAL');

        const payloadHash = crypto.createHash('sha256').update(JSON.stringify(validArgs)).digest('hex');
        const { data: approval } = await supabase
          .from('approval_requests')
          .insert({
            user_id: context.userId,
            tool_name: call.name,
            tool_input: validArgs,
            description: permission.reason || `Approval required for ${call.name}`,
            status: 'PENDING'
          })
          .select('id')
          .single();

        const approvalId = approval?.id || `appr_${Date.now()}_${payloadHash.slice(0, 8)}`;
        const card: ActionCard = {
          id: approvalId,
          type: 'APPROVAL_REQUIRED',
          title: `Approval Required: ${call.name}`,
          subtitle: permission.reason,
          data: {
            toolName: call.name,
            payload: validArgs,
            payloadHash,
            riskLevel: permission.riskLevel
          },
          requiresApproval: true,
          approvalId
        };
        cards.push(card);

        await supabase.from('ai_tool_calls').insert({
          user_id: context.userId,
          tool_name: call.name,
          input: validArgs,
          output: { approvalId, payloadHash },
          status: 'APPROVAL_REQUIRED',
          idempotency_key: key,
          latency_ms: Date.now() - startedAt
        });

        traces.push({
          step,
          tool: call.name,
          callId: call.id,
          status: 'APPROVAL_REQUIRED',
          latencyMs: Date.now() - startedAt,
          input: validArgs,
          output: { approvalId, payloadHash }
        });

        await saveCheckpoint('WAITING_APPROVAL');
        return {
          status: 'WAITING_APPROVAL',
          finalText: finalText || `Approval is required before ${call.name} can run.`,
          cards,
          executedTools,
          traces,
          steps,
          maxStepsReached: false,
          usage
        };
      }

      onStatus?.(`EXECUTING_${call.name.toUpperCase()}`);

      let result: ToolResult;
      try {
        result = await tool.execute(validArgs, {
          ...context,
          idempotencyKey: key
        });
      } catch (error) {
        result = {
          ok: false,
          errorCode: 'TOOL_EXECUTION_EXCEPTION',
          message: error instanceof Error ? error.message : String(error)
        };
      }

      const latencyMs = Date.now() - startedAt;
      if (result.card) cards.push(result.card);
      if (result.ok) {
        successfulSignatures.add(signature);
        executedTools.push(call.name);
      } else {
        hadFailure = true;
      }

      await supabase.from('ai_tool_calls').insert({
        user_id: context.userId,
        tool_name: call.name,
        input: validArgs,
        output: result.data || {},
        status: result.ok ? 'SUCCESS' : 'FAILED',
        idempotency_key: key,
        latency_ms: latencyMs,
        error_message: result.errorCode
      });

      traces.push({
        step,
        tool: call.name,
        callId: call.id,
        status: result.ok ? 'SUCCESS' : 'FAILED',
        latencyMs,
        input: validArgs,
        output: result.data,
        error: result.ok ? undefined : (result.errorCode || result.message)
      });

      workingMessages.push({
        role: 'tool',
        name: call.name,
        tool_call_id: call.id,
        content: stringifyToolObservation(result)
      });
    }

    await saveCheckpoint('ACTIVE');

    // The deterministic fallback provider cannot consume native function-response
    // turns. Stop after one execution cycle and return verified tool messages.
    if (provider.name === 'fallback_intelligence') {
      const verified = traces
        .filter(trace => trace.step === step)
        .map(trace => {
          if (trace.status === 'SUCCESS') return `${trace.tool} completed successfully.`;
          return `${trace.tool}: ${trace.error || trace.status}.`;
        })
        .join(' ');

      finalText = verified || finalText || 'Command processed.';
      await saveCheckpoint('COMPLETE');
      return {
        status: hadFailure ? 'PARTIAL' : 'SUCCESS',
        finalText,
        cards,
        executedTools,
        traces,
        steps,
        maxStepsReached: false,
        usage
      };
    }
  }

  finalText = finalText || 'Maximum agent steps reached. Current verified work has been preserved.';
  await saveCheckpoint('PAUSED');

  return {
    status: hadFailure ? 'PARTIAL' : 'SUCCESS',
    finalText,
    cards,
    executedTools,
    traces,
    steps,
    maxStepsReached: true,
    usage
  };
}
