import { z } from 'zod';
import {
  AIProvider,
  AIProviderResponse,
  GenerateOptions,
  ModelMessage,
  ToolDefinition
} from '../types';

function zodToOpenAISchema(schema: z.ZodTypeAny): Record<string, any> {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToOpenAISchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return zodToOpenAISchema(schema.removeDefault());
  }
  if (schema instanceof z.ZodString) return { type: 'string', description: schema.description };
  if (schema instanceof z.ZodNumber) return { type: 'number', description: schema.description };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean', description: schema.description };
  if (schema instanceof z.ZodLiteral) return { const: schema._def.value };
  if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: schema._def.values, description: schema.description };
  }
  if (schema instanceof z.ZodArray) {
    return { type: 'array', items: zodToOpenAISchema(schema.element), description: schema.description };
  }
  if (schema instanceof z.ZodRecord) {
    return { type: 'object', additionalProperties: zodToOpenAISchema(schema._def.valueType) };
  }
  if (schema instanceof z.ZodUnion) {
    return { anyOf: schema._def.options.map((option: z.ZodTypeAny) => zodToOpenAISchema(option)) };
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key of Object.keys(shape)) {
      const field = shape[key];
      properties[key] = zodToOpenAISchema(field);
      const optional =
        field instanceof z.ZodOptional ||
        field instanceof z.ZodDefault ||
        field.isOptional?.();
      if (!optional) required.push(key);
    }

    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false
    };
  }

  return {};
}

function toGatewayMessages(messages: ModelMessage[]) {
  return messages.map(message => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.tool_call_id
      };
    }

    if (message.role === 'assistant' && message.tool_calls?.length) {
      return {
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.tool_calls
      };
    }

    return {
      role: message.role,
      content: message.content
    };
  });
}

export class VercelGatewayProvider implements AIProvider {
  name = 'vercel-ai-gateway';
  readonly model: string;
  private token: string;

  constructor(model?: string) {
    this.model =
      model ||
      process.env.AI_GATEWAY_MODEL ||
      'google/gemini-3.6-flash';

    this.token =
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      '';
  }

  isConfigured(): boolean {
    return Boolean(this.token);
  }

  async generate(
    messages: ModelMessage[],
    options?: GenerateOptions
  ): Promise<AIProviderResponse> {
    if (!this.token) {
      throw new Error(
        'Vercel AI Gateway is not authenticated. Configure AI_GATEWAY_API_KEY or deploy with Vercel OIDC available.'
      );
    }

    const tools = options?.tools?.map((tool: ToolDefinition) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToOpenAISchema(tool.schema)
      }
    }));

    const response = await fetch(
      'https://ai-gateway.vercel.sh/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: toGatewayMessages(messages),
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1500,
          stream: false,
          ...(tools?.length ? { tools, tool_choice: 'auto' } : {})
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Vercel AI Gateway error (${response.status}): ${body.slice(0, 800)}`
      );
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message || {};
    const toolCalls = Array.isArray(message.tool_calls)
      ? message.tool_calls.map((call: any, index: number) => {
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(call?.function?.arguments || '{}');
          } catch {
            args = {};
          }

          return {
            id: call.id || `gateway_call_${Date.now()}_${index}`,
            name: call?.function?.name || '',
            arguments: args
          };
        }).filter((call: any) => call.name)
      : undefined;

    return {
      content: message.content || '',
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      usage: {
        inputTokens: Number(data?.usage?.prompt_tokens || 0),
        outputTokens: Number(data?.usage?.completion_tokens || 0),
        totalTokens: Number(data?.usage?.total_tokens || 0)
      }
    };
  }

  async stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: {
      onToken: (token: string) => void;
      onStatus?: (status: string) => void;
    }
  ): Promise<AIProviderResponse> {
    callbacks.onStatus?.('CONNECTING_VERCEL_AI_GATEWAY');
    const response = await this.generate(messages, options);

    if (response.content) {
      for (const token of response.content.split(' ')) {
        callbacks.onToken(token + ' ');
      }
    }

    return response;
  }
}
