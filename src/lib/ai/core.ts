import { MentraIncomingMessage, MentraMessage, ActionCard, ModelMessage } from './types';
import { getAIProvider } from './provider';
import { getMentraSystemPrompt } from './prompts';
import { buildMentraContext } from './context';
import { checkRateLimit, sanitizeInputText } from './safety';
import { MENTRA_TOOL_REGISTRY, ALL_MENTRA_TOOLS } from './tools/registry';
import { createClient } from '@/lib/supabase/server';

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
  const startTime = Date.now();
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
          const idempotencyKey = incoming.externalMessageId ? `${incoming.externalMessageId}_${call.name}` : `tool_${Date.now()}`;

          // Server-side Zod validation
          const parsedArgs = toolDef.schema.safeParse(call.arguments);
          const validArgs = parsedArgs.success ? parsedArgs.data : call.arguments;

          // Execute tool with context
          const toolResult = await toolDef.execute(validArgs, {
            userId: incoming.userId,
            conversationId,
            idempotencyKey,
            pageContext: incoming.pageContext
          });

          const toolLatency = Date.now() - toolStartTime;
          executedTools.push(call.name);

          if (toolResult.card) {
            accumulatedCards.push(toolResult.card);
          }

          if (toolResult.message && (!finalResponseText || finalResponseText.includes('Executing') || finalResponseText.includes('Retrieving') || finalResponseText.includes('Searching') || finalResponseText.includes('Analyzing') || finalResponseText.includes('Initializing'))) {
            finalResponseText = toolResult.message;
          }

          // Log Tool Execution to DB
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

    // 10. Record AI Run Metrics
    const totalLatency = Date.now() - startTime;
    await supabase.from('ai_runs').insert({
      user_id: incoming.userId,
      conversation_id: conversationId,
      provider: provider.name,
      model: process.env.AI_MODEL_SMART || 'gemini-1.5-flash',
      purpose: 'CHAT',
      latency_ms: totalLatency,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: finalResponseText || 'Command processed.',
      cards: accumulatedCards,
      conversationId,
      toolCallsExecuted: executedTools
    };

  } catch (err: any) {
    console.error('[MENTRA CORE ERR]:', err);
    const fallbackMsg = `[MENTRA CORE]: System operational. An error occurred while processing command: ${err.message}`;

    return {
      success: false,
      message: fallbackMsg,
      cards: [],
      conversationId,
      toolCallsExecuted: executedTools,
      error: err.message
    };
  }
}
