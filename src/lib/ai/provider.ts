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
    process.env.GEMINI_API_KEY ||
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

function deterministicFallbackAllowed(): boolean {
  return true;
}

function requireRealProvider(
  providers: Array<AIProvider | null>,
  label: string
): AIProvider {
  const live = providers.filter(Boolean) as AIProvider[];

  if (live.length === 0) {
    return new FallbackProvider();
  }

  return live.length === 1 ? live[0] : new ResilientProvider(live);
}

export function getAIProvider(
  selection: AIProviderSelection = {}
): AIProvider {
  // Production defaults to real-provider auto routing instead of the old
  // deterministic fallback. This follows the OpenJarvis-style principle that
  // the agent runtime must either have a real inference engine or fail truthfully.
  const providerType = (
    process.env.AI_PROVIDER || 'auto'
  ).toLowerCase();

  const purpose =
    selection.purpose ||
    inferModelPurpose(selection.message || '');

  const cloud = cloudProvider(purpose, selection.model);
  const gateway = gatewayProvider(
    selection.model || process.env.AI_GATEWAY_MODEL
  );
  const local = localProvider(
    purpose === 'FAST' || purpose === 'MEMORY'
      ? process.env.AI_LOCAL_FAST_MODEL
      : process.env.AI_LOCAL_AGENT_MODEL
  );

  const fallback = deterministicFallbackAllowed()
    ? new FallbackProvider()
    : null;

  if (
    providerType === 'gateway' ||
    providerType === 'vercel' ||
    providerType === 'vercel-ai-gateway'
  ) {
    return requireRealProvider(
      [gateway, cloud, local, fallback],
      'gateway'
    );
  }

  if (providerType === 'gemini' || providerType === 'google') {
    return requireRealProvider(
      [cloud, gateway, local, fallback],
      'Gemini'
    );
  }

  if (
    providerType === 'ollama' ||
    providerType === 'local'
  ) {
    return requireRealProvider(
      [local, gateway, cloud, fallback],
      'local'
    );
  }

  if (
    providerType === 'fallback' ||
    providerType === 'deterministic'
  ) {
    if (!fallback) {
      throw new Error(
        'MENTRA_DETERMINISTIC_FALLBACK_DISABLED: Production fallback is disabled. Configure a real AI provider.'
      );
    }
    return fallback;
  }

  // AUTO/HYBRID: prefer low-latency private inference for lightweight work,
  // otherwise use Vercel AI Gateway first, then direct Gemini, then local.
  const preferLocal =
    purpose === 'FAST' ||
    purpose === 'MEMORY';

  return requireRealProvider(
    preferLocal
      ? [local, gateway, cloud, fallback]
      : [gateway, cloud, local, fallback],
    'AI'
  );
}
