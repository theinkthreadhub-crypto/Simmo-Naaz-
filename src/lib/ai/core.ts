import { MentraIncomingMessage, ActionCard, ModelMessage } from './types';
import { getAIProvider } from './provider';
import { getMentraSystemPrompt } from './prompts';
import { buildMentraContext } from './context';
import { checkRateLimit, sanitizeInputText } from './safety';
import { MENTRA_TOOL_REGISTRY, ALL_MENTRA_TOOLS } from './tools/registry';
import { createClient } from '@/lib/supabase/server';
import { evaluateToolPermission, getConfiguredAutonomyMode } from '@/lib/safety/riskEngine';
import crypto from 'crypto';
import { redactForAudit } from '@/lib/safety/auditRedaction';
import { runMentraAgentRuntime } from './agentRuntime';
import { extractDurableMemories } from '@/lib/memory/extractor';
import { evaluateRunAndPersist } from '@/lib/evals/runtimeLearning';

export type AIRunStatus = 'SUCCESS' | 'PARTIAL' | 'WAITING_APPROVAL' | 'FAILED';

export interface RunMentraResult {
  success: boolean;
  status: AIRunStatus;
  message: string;
  cards: ActionCard[];
  conversationId: string;
  toolCallsExecuted: string[];
  error?: string;
}

export async function runMentra(
  incoming: MentraIncomingMessage,
  callbacks?: {
    onToken?: (token: string) => void;
    onStatus?: (status: string) => void;
  }
): Promise<RunMentraResult> {
  const supabase = createClient();
  const cleanText = sanitizeInputText(incoming.text);

  // 1. Rate Limiting Check
  const rateLimit = checkRateLimit(incoming.userId);
  if (!rateLimit.allowed) {
    const errorMsg = `Daily request limit reached. Please wait ${rateLimit.resetInSec}s.`;
    return {
      success: false,
      status: 'FAILED',
      message: errorMsg,
      cards: [],
      conversationId: incoming.conversationId || '',
      toolCallsExecuted: [],
      error: errorMsg
    };
  }

  // 2. Ensure Conversation Record
  let conversationId: string = incoming.conversationId || '';
  if (!conversationId) {
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        user_id: incoming.userId,
        title: cleanText.slice(0, 40) || 'Intelligence Session',
        channel: incoming.channel || 'WEB'
      })
      .select()
      .single();

    conversationId = conv?.id || `conv_${Date.now()}`;
  }

  // 3. Persist Incoming User Message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    user_id: incoming.userId,
    role: 'USER',
    content: cleanText
  });

  // 4. Fetch Conversation History (last 8 messages)
  const { data: history } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(8);

  // 5. Build Context and System Prompt
  if (callbacks?.onStatus) callbacks.onStatus('GATHERING_TELEMETRY');
  const contextData = await buildMentraContext(incoming.userId, cleanText, incoming.pageContext);
  const systemPrompt = getMentraSystemPrompt(contextData);

  // 6. Build Model Messages
  const modelMessages: ModelMessage[] = [
    { role: 'system', content: systemPrompt }
  ];

  if (history && history.length > 0) {
    for (const h of history) {
      modelMessages.push({
        role: h.role === 'ASSISTANT' ? 'assistant' : 'user',
        content: h.content
      });
    }
  } else {
    modelMessages.push({ role: 'user', content: cleanText });
  }

  // 7. Invoke Provider
  if (callbacks?.onStatus) callbacks.onStatus('ANALYZING_INTENT');
  const provider = getAIProvider({ message: cleanText });
  const maxSteps = Number(process.env.AI_MAX_TOOL_STEPS) || 4;

  // Agent Runtime V2 is opt-in until production verification is complete.
  // It enables multi-step Plan -> Tool -> Observe -> Re-plan loops while
  // preserving the legacy execution path as the default.
  if (process.env.AI_AGENT_RUNTIME_V2 === 'true') {
    try {
      const runtime = await runMentraAgentRuntime({
        provider,
        messages: modelMessages,
        tools: ALL_MENTRA_TOOLS,
        toolRegistry: MENTRA_TOOL_REGISTRY,
        context: {
          userId: incoming.userId,
          conversationId,
          pageContext: incoming.pageContext
        },
        externalMessageId: incoming.externalMessageId,
        maxSteps,
        temperature: 0.2,
        agentKey: `core:${conversationId}`,
        objective: cleanText,
        persistState: true,
        onStatus: callbacks?.onStatus
      });

      const responseText = runtime.finalText || 'Command processed.';

      if (callbacks?.onToken && responseText) {
        for (const word of responseText.split(' ')) {
          callbacks.onToken(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: incoming.userId,
        role: 'ASSISTANT',
        content: responseText,
        cards: runtime.cards,
        tool_calls: runtime.traces.map(trace => ({
          name: trace.tool,
          status: trace.status,
          step: trace.step,
          latencyMs: trace.latencyMs
        }))
      });

      await extractDurableMemories(
        incoming.userId,
        cleanText,
        responseText,
        conversationId
      );

      const { data: aiRunRecord } = await supabase
        .from('ai_runs')
        .insert({
          user_id: incoming.userId,
          conversation_id: conversationId,
          provider: provider.name,
          model: provider.model || process.env.AI_MODEL_SMART || process.env.AI_MODEL_FAST || 'provider-default',
          purpose: 'AGENT_RUNTIME_V2',
          input_tokens: runtime.usage.inputTokens,
          output_tokens: runtime.usage.outputTokens,
          latency_ms: runtime.traces.reduce((sum, trace) => sum + trace.latencyMs, 0),
          status: runtime.status === 'FAILED' ? 'FAILED' : 'SUCCESS'
        })
        .select('id')
        .single();

      if (aiRunRecord?.id) {
        await evaluateRunAndPersist({
          userId: incoming.userId,
          aiRunId: aiRunRecord.id,
          runStatus: runtime.status,
          responseText,
          traces: runtime.traces,
          maxStepsReached: runtime.maxStepsReached
        });
      }

      return {
        success: runtime.status !== 'FAILED',
        status: runtime.status,
        message: responseText,
        cards: runtime.cards,
        conversationId,
        toolCallsExecuted: runtime.executedTools
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[MENTRA AGENT RUNTIME V2 ERROR]:', err);

      return {
        success: false,
        status: 'FAILED',
        message: 'MENTRA Agent Runtime encountered an unexpected error.',
        cards: [],
        conversationId,
        toolCallsExecuted: [],
        error: errorMsg
      };
    }
  }

  let currentStep = 0;
  const executedTools: string[] = [];
  const accumulatedCards: ActionCard[] = [];
  let finalResponseText = '';
  const toolResultsForSynthesis: Array<{ tool: string; result: any; args: any }> = [];
  let hasPendingApproval = false;
  let hasToolFailure = false;

  try {
    const aiResponse = await provider.generate(modelMessages, {
      tools: ALL_MENTRA_TOOLS,
      temperature: 0.2
    });

    finalResponseText = aiResponse.content || '';

    // 8. Tool Calling Execution Loop
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      for (const call of aiResponse.toolCalls) {
        if (currentStep >= maxSteps) break;
        currentStep++;

        const toolDef = MENTRA_TOOL_REGISTRY[call.name];
        if (toolDef) {
          if (callbacks?.onStatus) callbacks.onStatus(`EXECUTING_${call.name.toUpperCase()}`);
          
          const toolStartTime = Date.now();
          const idempotencyKey = incoming.externalMessageId 
            ? `${incoming.externalMessageId}_${call.name}` 
            : `tool_${incoming.userId}_${Date.now()}_${call.name}`;

          // Server-side Zod validation: NEVER execute raw invalid arguments!
          const parsedArgs = toolDef.schema.safeParse(call.arguments);
          if (!parsedArgs.success) {
            hasToolFailure = true;
            const validationError = parsedArgs.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            console.warn(`[AI TOOL SCHEMA ERROR] Tool '${call.name}' validation failed:`, validationError);

            await supabase.from('ai_tool_calls').insert({
              user_id: incoming.userId,
              tool_name: call.name,
              input: redactForAudit(call.arguments),
              output: {},
              status: 'VALIDATION_FAILED',
              idempotency_key: idempotencyKey,
              latency_ms: Date.now() - toolStartTime,
              error_message: validationError
            });

            toolResultsForSynthesis.push({
              tool: call.name,
              args: call.arguments,
              result: { ok: false, errorCode: 'VALIDATION_FAILED', message: `Validation error: ${validationError}` }
            });
            continue;
          }

          const validArgs = parsedArgs.data;

          // Deterministic Risk & Permission check
          const permission = evaluateToolPermission(
            toolDef.permission,
            getConfiguredAutonomyMode(),
            call.name,
            validArgs
          );
          if (permission.requiresApproval) {
            hasPendingApproval = true;
            const payloadHash = crypto
              .createHash('sha256')
              .update(JSON.stringify(validArgs))
              .digest('hex');

            const { data: approvalRecord, error: approvalError } = await supabase
              .from('approval_requests')
              .insert({
                user_id: incoming.userId,
                tool_name: call.name,
                tool_input: validArgs,
                description:
                  permission.reason ||
                  `Approval required before ${call.name} can execute.`,
                status: 'PENDING'
              })
              .select('id')
              .single();

            if (approvalError || !approvalRecord?.id) {
              hasToolFailure = true;
              toolResultsForSynthesis.push({
                tool: call.name,
                args: validArgs,
                result: {
                  ok: false,
                  errorCode: 'APPROVAL_PERSIST_FAILED',
                  message: approvalError?.message || 'Could not persist approval request.'
                }
              });
              continue;
            }

            const approvalId = approvalRecord.id;

            const approvalCard: ActionCard = {
              id: approvalId,
              type: 'APPROVAL_REQUIRED',
              title: `Approval Required: ${call.name}`,
              subtitle: permission.reason || 'Mutating external action requires human sign-off',
              data: {
                toolName: call.name,
                payload: validArgs,
                payloadHash,
                riskLevel: permission.riskLevel
              },
              requiresApproval: true,
              approvalId
            };

            accumulatedCards.push(approvalCard);
            
            await supabase.from('ai_tool_calls').insert({
              user_id: incoming.userId,
              tool_name: call.name,
              input: redactForAudit(validArgs),
              output: { approvalId, status: 'APPROVAL_REQUIRED' },
              status: 'APPROVAL_REQUIRED',
              idempotency_key: idempotencyKey,
              latency_ms: Date.now() - toolStartTime
            });

            toolResultsForSynthesis.push({
              tool: call.name,
              args: validArgs,
              result: { ok: false, errorCode: 'APPROVAL_REQUIRED', message: `Authorization required: ${permission.reason}` }
            });
            continue;
          }

          // Execute tool with validated arguments and context
          const toolResult = await toolDef.execute(validArgs, {
            userId: incoming.userId,
            conversationId,
            idempotencyKey,
            pageContext: incoming.pageContext
          });

          const toolLatency = Date.now() - toolStartTime;
          executedTools.push(call.name);
          toolResultsForSynthesis.push({ tool: call.name, args: validArgs, result: toolResult });

          if (!toolResult.ok) {
            hasToolFailure = true;
          }

          if (toolResult.card) {
            accumulatedCards.push(toolResult.card);
          }

          // Log Tool Execution to DB with truthful status
          await supabase.from('ai_tool_calls').insert({
            user_id: incoming.userId,
            tool_name: call.name,
            input: redactForAudit(validArgs),
            output: redactForAudit(toolResult.data || {}),
            status: toolResult.ok ? 'SUCCESS' : 'FAILED',
            idempotency_key: idempotencyKey,
            latency_ms: toolLatency,
            error_message: toolResult.errorCode
          });
        }
      }

      // 9. Tool Result Final Synthesis Loop
      if (toolResultsForSynthesis.length > 0) {
        if (callbacks?.onStatus) callbacks.onStatus('SYNTHESIZING_RESPONSE');

        const synthesisContext = toolResultsForSynthesis.map(t => {
          return `[Action: ${t.tool}]
Input: ${JSON.stringify(t.args)}
Status: ${t.result.ok ? 'SUCCESS' : (t.result.errorCode || 'FAILED')}
Result Data: ${JSON.stringify(t.result.data || {})}
Message: ${t.result.message || ''}`;
        }).join('\n\n');

        const synthesisMessages: ModelMessage[] = [
          ...modelMessages,
          {
            role: 'assistant',
            content: `I executed the requested operations with the following verifiable results:\n\n${synthesisContext}`
          },
          {
            role: 'user',
            content: `Synthesize a concise, natural, and truthful final response for the user request: "${cleanText}".
Rules:
1. Use ONLY the verified data returned above.
2. If an action succeeded, confirm it clearly with the exact figures/data.
3. If an action required approval or failed, state that truthfully without pretending it completed.
4. Do not invent unrecorded metrics or duplicate operations.`
          }
        ];

        try {
          const synthesisResponse = await provider.generate(synthesisMessages, {
            temperature: 0.2,
            maxTokens: 800
          });

          if (synthesisResponse.content?.trim()) {
            finalResponseText = synthesisResponse.content.trim();
          }
        } catch (synthErr) {
          console.warn('[AI SYNTHESIS FALLBACK]:', synthErr);
          // Deterministic fallback preserves execution truth without implying tool failure
          const truthfulMessages = toolResultsForSynthesis.map(t => t.result.message).filter(Boolean);
          if (truthfulMessages.length > 0) {
            finalResponseText = truthfulMessages.join(' ');
          }
        }
      }
    }

    // Determine overall run status
    let runStatus: AIRunStatus = 'SUCCESS';
    if (hasPendingApproval) {
      runStatus = 'WAITING_APPROVAL';
    } else if (hasToolFailure && executedTools.length > 0) {
      runStatus = 'PARTIAL';
    } else if (hasToolFailure && executedTools.length === 0) {
      runStatus = 'FAILED';
    }

    // Stream out final tokens if callback provided
    if (callbacks?.onToken && finalResponseText) {
      const words = finalResponseText.split(' ');
      for (const w of words) {
        callbacks.onToken(w + ' ');
        await new Promise(r => setTimeout(r, 10));
      }
    }

    // 10. Persist Assistant Message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: incoming.userId,
      role: 'ASSISTANT',
      content: finalResponseText || '[MENTRA Command Executed]',
      cards: accumulatedCards,
      tool_calls: executedTools.map(t => ({ name: t, status: 'SUCCESS' }))
    });

    await extractDurableMemories(
      incoming.userId,
      cleanText,
      finalResponseText || '[MENTRA Command Executed]',
      conversationId
    );

    const { data: legacyRunRecord } = await supabase
      .from('ai_runs')
      .insert({
        user_id: incoming.userId,
        conversation_id: conversationId,
        provider: provider.name,
        model:
          provider.model ||
          process.env.AI_MODEL_SMART ||
          process.env.AI_MODEL_FAST ||
          'provider-default',
        purpose: 'LEGACY_TOOL_RUNTIME',
        input_tokens: aiResponse.usage?.inputTokens || 0,
        output_tokens: aiResponse.usage?.outputTokens || 0,
        latency_ms: toolResultsForSynthesis.reduce(
          (sum, item) => sum + Number(item.result?.latencyMs || 0),
          0
        ),
        status: runStatus === 'FAILED' ? 'FAILED' : 'SUCCESS'
      })
      .select('id')
      .single();

    if (legacyRunRecord?.id) {
      await evaluateRunAndPersist({
        userId: incoming.userId,
        aiRunId: legacyRunRecord.id,
        runStatus,
        responseText: finalResponseText || '[MENTRA Command Executed]',
        traces: toolResultsForSynthesis.map(item => ({
          tool: item.tool,
          status:
            item.result?.ok === true
              ? 'SUCCESS'
              : item.result?.errorCode || 'FAILED'
        })),
        maxStepsReached: currentStep >= maxSteps
      });
    }

    return {
      success: runStatus !== 'FAILED',
      status: runStatus,
      message: finalResponseText || 'Command processed.',
      cards: accumulatedCards,
      conversationId,
      toolCallsExecuted: executedTools
    };

  } catch (err: any) {
    console.error('[MENTRA AI CORE ERROR]:', err);
    return {
      success: false,
      status: 'FAILED',
      message: 'MENTRA AI encountered an unexpected error processing your request.',
      cards: [],
      conversationId,
      toolCallsExecuted: executedTools,
      error: err.message
    };
  }
}
