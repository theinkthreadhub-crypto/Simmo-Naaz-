import { AIProvider, AIProviderResponse, ModelMessage, GenerateOptions, ToolDefinition } from '../types';
import { z } from 'zod';

/**
 * Converts a Zod Schema into a Gemini-compliant JSON Schema representation
 */
function convertZodToGeminiSchema(schema: z.ZodTypeAny): Record<string, any> {
  if (!schema) {
    return { type: 'OBJECT', properties: {} };
  }

  // Handle Optional, Nullable, Default wrappers
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return convertZodToGeminiSchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return convertZodToGeminiSchema(schema.removeDefault());
  }

  if (schema instanceof z.ZodString) {
    return { type: 'STRING', description: schema.description };
  }

  if (schema instanceof z.ZodNumber) {
    return { type: 'NUMBER', description: schema.description };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'BOOLEAN', description: schema.description };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'STRING',
      enum: schema._def.values,
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'ARRAY',
      items: convertZodToGeminiSchema(schema.element),
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      properties[key] = convertZodToGeminiSchema(fieldSchema);

      const isOptional =
        fieldSchema instanceof z.ZodOptional ||
        fieldSchema instanceof z.ZodDefault ||
        fieldSchema.isOptional?.();

      if (!isOptional) {
        required.push(key);
      }
    }

    const result: Record<string, any> = {
      type: 'OBJECT',
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  return { type: 'STRING' };
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || process.env.AI_PROVIDER_API_KEY || '';
    this.defaultModel = model || process.env.AI_MODEL_SMART || 'gemini-1.5-flash';
  }

  async generate(messages: ModelMessage[], options?: GenerateOptions): Promise<AIProviderResponse> {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured on the server.');
    }

    const modelName = options?.model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    // Convert messages to Gemini format, including native function-call turns.
    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        if (m.role === 'tool') {
          let responsePayload: Record<string, any>;
          try {
            responsePayload = JSON.parse(m.content);
          } catch {
            responsePayload = { content: m.content };
          }

          return {
            role: 'user',
            parts: [{
              functionResponse: {
                name: m.name || 'tool',
                response: responsePayload
              }
            }]
          };
        }

        if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
          const parts: Array<Record<string, any>> = [];
          if (m.content) parts.push({ text: m.content });
          for (const call of m.tool_calls) {
            let args: Record<string, any> = {};
            try {
              args = JSON.parse(call.function.arguments || '{}');
            } catch {
              args = {};
            }
            parts.push({
              functionCall: {
                name: call.function.name,
                args
              }
            });
          }
          return { role: 'model', parts };
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        };
      });

    // Convert tools if provided with real parameter schemas
    let toolsPayload = undefined;
    if (options?.tools && options.tools.length > 0) {
      const functionDeclarations = options.tools.map((t: ToolDefinition) => {
        const schemaObj = t.schema ? convertZodToGeminiSchema(t.schema) : { type: 'OBJECT', properties: {} };
        return {
          name: t.name,
          description: t.description,
          parameters: schemaObj,
        };
      });
      toolsPayload = [{ functionDeclarations }];
    }

    const payload: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1500
      }
    };

    if (systemMsg) {
      payload.systemInstruction = {
        parts: [{ text: systemMsg }]
      };
    }

    if (toolsPayload) {
      payload.tools = toolsPayload;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: any) => p.text)?.text || '';
    
    // Safely parse all function call parts returned by Gemini
    const functionCallParts = candidate?.content?.parts?.filter((p: any) => p.functionCall) || [];

    const toolCalls = functionCallParts.length > 0 ? functionCallParts.map((fPart: any, index: number) => ({
      id: `call_${Date.now()}_${index}`,
      name: fPart.functionCall.name,
      arguments: fPart.functionCall.args || {}
    })) : undefined;

    return {
      content: textPart,
      toolCalls,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  async stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: { onToken: (token: string) => void; onStatus?: (status: string) => void }
  ): Promise<AIProviderResponse> {
    if (callbacks.onStatus) callbacks.onStatus('CONNECTING_AI_CORE');
    const response = await this.generate(messages, options);

    if (callbacks.onToken && response.content) {
      const words = response.content.split(' ');
      for (const word of words) {
        callbacks.onToken(word + ' ');
        await new Promise(r => setTimeout(r, 12));
      }
    }

    return response;
  }
}

export { convertZodToGeminiSchema };
