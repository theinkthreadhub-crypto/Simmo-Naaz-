import { AIProvider, AIProviderResponse, ModelMessage, GenerateOptions } from '../types';

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

    // Convert messages to Gemini format
    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Convert tools if provided
    let toolsPayload = undefined;
    if (options?.tools && options.tools.length > 0) {
      const functionDeclarations = options.tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      }));
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
    const functionCallPart = candidate?.content?.parts?.find((p: any) => p.functionCall);

    const toolCalls = functionCallPart ? [{
      id: `call_${Date.now()}`,
      name: functionCallPart.functionCall.name,
      arguments: functionCallPart.functionCall.args || {}
    }] : undefined;

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
    const result = await this.generate(messages, options);

    if (result.content) {
      const words = result.content.split(' ');
      for (const word of words) {
        callbacks.onToken(word + ' ');
        await new Promise(r => setTimeout(r, 12));
      }
    }

    return result;
  }
}
