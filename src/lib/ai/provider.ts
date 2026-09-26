import { AIProvider } from './types';
import { GeminiProvider } from './providers/geminiProvider';
import { OllamaProvider } from './providers/ollamaProvider';
import { FallbackProvider } from './providers/fallbackProvider';
import { VercelGatewayProvider } from './providers/vercelGatewayProvider';
import { ResilientProvider } from './resilientProvider';
import {
  inferModelPurpose,
  ModelPurpose,
  selectGeminiModel
} from './modelRouter';

export interface AIProviderSelection {
  purpose?: ModelPurpose;
  message?: string;
  model?: string;
}

function cloudProvider(
  purpose: ModelPurpose,
  explicitModel?: string
): AIProvider | null {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.AI_PROVIDER_API_KEY;

  if (!apiKey) return null;

  const route = selectGeminiModel(purpose, explicitModel);
  return new GeminiProvider(apiKey, route.model);
}

function gatewayProvider(explicitModel?: string): AIProvider | null {
  const gateway = new VercelGatewayProvider(explicitModel);
  return gateway.isConfigured() ? gateway : null;
}

function localProvider(explicitModel?: string): AIProvider | null {
  const baseUrl = process.env.AI_LOCAL_BASE_URL?.trim();
  if (!baseUrl) return null;

  return new OllamaProvider(
    baseUrl,
    explicitModel ||
      process.env.AI_LOCAL_MODEL ||
      'qwen3:8b'
  );
}

export function getAIProvider(
  selection: AIProviderSelection = {}
): AIProvider {
  const providerType = (
    process.env.AI_PROVIDER || 'fallback'
  ).toLowerCase();

  const purpose =
    selection.purpose ||
    inferModelPurpose(selection.message || '');

  const fallback = new FallbackProvider();
  const cloud = cloudProvider(purpose, selection.model);
  const gateway = gatewayProvider(
    selection.model || process.env.AI_GATEWAY_MODEL
  );
  const local = localProvider(
    purpose === 'FAST' || purpose === 'MEMORY'
      ? process.env.AI_LOCAL_FAST_MODEL
      : process.env.AI_LOCAL_AGENT_MODEL
  );

  if (
    providerType === 'gateway' ||
    providerType === 'vercel' ||
    providerType === 'vercel-ai-gateway'
  ) {
    return new ResilientProvider(
      [gateway, cloud, local, fallback].filter(Boolean) as AIProvider[]
    );
  }

  if (providerType === 'gemini' || providerType === 'google') {
    return new ResilientProvider(
      [cloud, local, fallback].filter(Boolean) as AIProvider[]
    );
  }

  if (
    providerType === 'ollama' ||
    providerType === 'local'
  ) {
    return new ResilientProvider(
      [local, cloud, fallback].filter(Boolean) as AIProvider[]
    );
  }

  if (
    providerType === 'auto' ||
    providerType === 'hybrid'
  ) {
    const preferLocal =
      purpose === 'FAST' ||
      purpose === 'MEMORY' ||
      purpose === 'CHAT';

    return new ResilientProvider(
      (preferLocal
        ? [local, gateway, cloud, fallback]
        : [gateway, cloud, local, fallback]
      ).filter(Boolean) as AIProvider[]
    );
  }

  return fallback;
}
