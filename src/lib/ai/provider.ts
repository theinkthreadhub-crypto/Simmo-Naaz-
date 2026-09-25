import { AIProvider } from './types';
import { GeminiProvider } from './providers/geminiProvider';
import { FallbackProvider } from './providers/fallbackProvider';

export function getAIProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || 'fallback').toLowerCase();
  const apiKey = process.env.AI_API_KEY || process.env.AI_PROVIDER_API_KEY;

  if ((providerType === 'gemini' || providerType === 'google') && apiKey) {
    return new GeminiProvider(apiKey);
  }

  // Default resilient fallback provider
  return new FallbackProvider();
}
