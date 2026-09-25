import { MentraIncomingMessage, ActionCard, ModelMessage } from './types';
import { getAIProvider } from './provider';
import { getMentraSystemPrompt } from './prompts';
import { buildMentraContext } from './context';
import { checkRateLimit, sanitizeInputText } from './safety';
import { MENTRA_TOOL_REGISTRY, ALL_MENTRA_TOOLS } from './tools/registry';
import { createClient } from '@/lib/supabase/server';
import { evaluateActionPermission } from '@/lib/safety/riskEngine';
import crypto from 'crypto';

export interface RunMentraResult {
  success: boolean;
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
  const provider = getAIProvider();
  const maxSteps = Number(process.env.AI_MAX_TOOL_STEPS) || 4;
  let currentStep = 0;
  const executedTools: string[] = [];
  const accumulatedCards: ActionCard[] = [];
  let finalResponseText = '';
  const toolResultsForSynthesis: Array<{ tool: string; result: any }> = [];

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
            const validationError = parsedArgs.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            console.warn(`[AI TOOL SCHEMA ERROR] Tool '${call.name}' validation failed:`, validationError);

            await supabase.from('ai_tool_calls').insert({
              user_id: incoming.userId,
              tool_name: call.name,
              input: call.arguments,
              output: {},
              status: 'TOOL_VALIDATION_FAILED',
              idempotency_key: idempotencyKey,
              latency_ms: Date.now() - toolStartTime,
              error_message: validationError
            });

            finalResponseText = `I encountered an issue with the parameters for ${call.name}: ${validationError}. Execution was prevented for data integrity.`;
            continue;
          }

          const validArgs = parsedArgs.data;

          // Deterministic Risk & Permission check
          const permission = evaluateActionPermission('ASSISTED', call.name, validArgs);
          if (permission.requiresApproval) {
            const payloadHash = crypto.createHash('sha256').update(JSON.stringify(validArgs)).digest('hex');
            const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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
            finalResponseText = `The action "${call.name}" requires your authorization before proceeding (${permission.reason}). Please review the approval card.`;
            
            await supabase.from('ai_tool_calls').insert({
              user_id: incoming.userId,
              tool_name: call.name,
              input: validArgs,
              output: { approvalId, status: 'APPROVAL_REQUIRED' },
              status: 'APPROVAL_REQUIRED',
              idempotency_key: idempotencyKey,
              latency_ms: Date.now() - toolStartTime
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
          toolResultsForSynthesis.push({ tool: call.name, result: toolResult });

          if (toolResult.card) {
            accumulatedCards.push(toolResult.card);
          }

          if (toolResult.message) {
            finalResponseText = toolResult.message;
          }

          // Log Tool Execution to DB with truthful status
          await supabase.from('ai_tool_calls').insert({
            user_id: incoming.userId,
            tool_name: call.name,
            input: validArgs,
            output: toolResult.data || {},
            status: toolResult.ok ? 'SUCCESS' : 'FAILED',
            idempotency_key: idempotencyKey,
            latency_ms: toolLatency,
            error_message: toolResult.errorCode
          });
        }
      }
    }

    // Stream out final tokens if callback provided
    if (callbacks?.onToken && finalResponseText) {
      const words = finalResponseText.split(' ');
      for (const w of words) {
        callbacks.onToken(w + ' ');
        await new Promise(r => setTimeout(r, 10));
      }
    }

    // 9. Persist Assistant Message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: incoming.userId,
      role: 'ASSISTANT',
      content: finalResponseText || '[MENTRA Command Executed]',
      cards: accumulatedCards,
      tool_calls: executedTools.map(t => ({ name: t, status: 'SUCCESS' }))
    });

    return {
      success: true,
      message: finalResponseText || 'Command processed.',
      cards: accumulatedCards,
      conversationId,
      toolCallsExecuted: executedTools
    };

  } catch (err: any) {
    console.error('[MENTRA AI CORE ERROR]:', err);
    return {
      success: false,
      message: 'MENTRA AI encountered an unexpected error processing your request.',
      cards: [],
      conversationId,
      toolCallsExecuted: executedTools,
      error: err.message
    };
  }
}
