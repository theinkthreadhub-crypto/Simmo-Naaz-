import { AIProvider } from './types';
import { GeminiProvider } from './providers/geminiProvider';
import { FallbackProvider } from './providers/fallbackProvider';
import { inferModelPurpose, ModelPurpose, selectGeminiModel } from './modelRouter';

export interface AIProviderSelection {
  purpose?: ModelPurpose;
  message?: string;
  model?: string;
}

export function getAIProvider(selection: AIProviderSelection = {}): AIProvider {
  const providerType = (process.env.AI_PROVIDER || 'fallback').toLowerCase();
  const apiKey = process.env.AI_API_KEY || process.env.AI_PROVIDER_API_KEY;
  const purpose = selection.purpose || inferModelPurpose(selection.message || '');

  if ((providerType === 'gemini' || providerType === 'google') && apiKey) {
    const route = selectGeminiModel(purpose, selection.model);
    return new GeminiProvider(apiKey, route.model);
  }

  // Default resilient deterministic provider. It remains available when cloud
  // inference is unavailable so read/write tools can still be routed safely.
  return new FallbackProvider();
}
