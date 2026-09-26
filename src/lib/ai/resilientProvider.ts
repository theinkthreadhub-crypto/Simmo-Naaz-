import {
  AIProvider,
  AIProviderResponse,
  GenerateOptions,
  ModelMessage
} from './types';

export class ResilientProvider implements AIProvider {
  name: string;
  model?: string;

  constructor(private providers: AIProvider[]) {
    if (providers.length === 0) {
      throw new Error('ResilientProvider requires at least one provider.');
    }

    this.name = providers.map(provider => provider.name).join('→');
    this.model = providers[0].model;
  }

  async generate(
    messages: ModelMessage[],
    options?: GenerateOptions
  ): Promise<AIProviderResponse> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const result = await provider.generate(messages, options);
        this.model = provider.model;
        return result;
      } catch (error) {
        errors.push(
          `${provider.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    throw new Error(`All AI providers failed. ${errors.join(' | ')}`);
  }

  async stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: {
      onToken: (token: string) => void;
      onStatus?: (status: string) => void;
    }
  ): Promise<AIProviderResponse> {
    const result = await this.generate(messages, options);
    for (const token of result.content.split(/(\s+)/).filter(Boolean)) {
      callbacks.onToken(token);
    }
    return result;
  }
}
