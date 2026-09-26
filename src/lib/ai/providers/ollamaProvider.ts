import { z } from 'zod';
import {
  AIProvider,
  AIProviderResponse,
  GenerateOptions,
  ModelMessage,
  ToolDefinition
} from '../types';

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, any> {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToJsonSchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return zodToJsonSchema(schema.removeDefault());
  }
  if (schema instanceof z.ZodString) return { type: 'string' };
  if (schema instanceof z.ZodNumber) return { type: 'number' };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean' };
  if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: schema._def.values };
  }
  if (schema instanceof z.ZodArray) {
    return { type: 'array', items: zodToJsonSchema(schema.element) };
  }
  if (schema instanceof z.ZodRecord) {
    return { type: 'object', additionalProperties: true };
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key of Object.keys(shape)) {
      const field = shape[key];
      properties[key] = zodToJsonSchema(field);
      const optional =
        field instanceof z.ZodOptional ||
        field instanceof z.ZodDefault ||
        field.isOptional?.();
      if (!optional) required.push(key);
    }

    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {})
    };
  }

  return { type: 'string' };
}

function normalizeMessages(messages: ModelMessage[]) {
  return messages.map(message => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content
      };
    }

    if (message.role === 'assistant' && message.tool_calls?.length) {
      return {
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls.map(call => ({
          function: {
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments || '{}')
          }
        }))
      };
    }

    return {
      role: message.role,
      content: message.content
    };
  });
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  readonly model: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(
    baseUrl: string = process.env.AI_LOCAL_BASE_URL || 'http://127.0.0.1:11434',
    model: string = process.env.AI_LOCAL_MODEL || 'qwen3:8b'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.timeoutMs = Math.max(
      5000,
      Number(process.env.AI_LOCAL_TIMEOUT_MS || 45000)
    );
  }

  async generate(
    messages: ModelMessage[],
    options?: GenerateOptions
  ): Promise<AIProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const tools = options?.tools?.map((tool: ToolDefinition) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.schema)
      }
    }));

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: normalizeMessages(messages),
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
            num_predict: options?.maxTokens ?? 1500
          },
          ...(tools?.length ? { tools } : {})
        })
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error (${response.status}): ${(await response.text()).slice(0, 800)}`
        );
      }

      const data = await response.json();
      const message = data?.message || {};
      const toolCalls = Array.isArray(message.tool_calls)
        ? message.tool_calls.map((call: any, index: number) => ({
            id: `ollama_${Date.now()}_${index}`,
            name: call?.function?.name || '',
            arguments:
              call?.function?.arguments &&
              typeof call.function.arguments === 'object'
                ? call.function.arguments
                : {}
          })).filter((call: any) => call.name)
        : undefined;

      return {
        content: message.content || '',
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        usage: {
          inputTokens: Number(data?.prompt_eval_count || 0),
          outputTokens: Number(data?.eval_count || 0),
          totalTokens:
            Number(data?.prompt_eval_count || 0) +
            Number(data?.eval_count || 0)
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: {
      onToken: (token: string) => void;
      onStatus?: (status: string) => void;
    }
  ): Promise<AIProviderResponse> {
    callbacks.onStatus?.('CONNECTING_LOCAL_AI');
    const result = await this.generate(messages, options);

    for (const token of result.content.split(/(\s+)/).filter(Boolean)) {
      callbacks.onToken(token);
    }

    return result;
  }
}
