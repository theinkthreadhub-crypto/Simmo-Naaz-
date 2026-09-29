export type ModelPurpose =
  | 'FAST'
  | 'CHAT'
  | 'AGENT'
  | 'RESEARCH'
  | 'SYNTHESIS'
  | 'MEMORY';

export interface ModelRoute {
  purpose: ModelPurpose;
  model: string;
  reason: string;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function inferModelPurpose(message: string): ModelPurpose {
  const clean = message.toLowerCase();
  const words = wordCount(message);

  if (
    clean.includes('research') ||
    clean.includes('latest') ||
    clean.includes('trend') ||
    clean.includes('market') ||
    clean.includes('competitor') ||
    clean.includes('source')
  ) {
    return 'RESEARCH';
  }

  if (
    words > 55 ||
    clean.includes('plan') ||
    clean.includes('strategy') ||
    clean.includes('analyze') ||
    clean.includes('analyse') ||
    clean.includes('compare') ||
    clean.includes('multi-agent') ||
    clean.includes('automate') ||
    clean.includes('workflow')
  ) {
    return 'AGENT';
  }

  if (words <= 12 && !clean.includes('create') && !clean.includes('send')) {
    return 'FAST';
  }

  return 'CHAT';
}

export function selectGeminiModel(
  purpose: ModelPurpose,
  explicitModel?: string
): ModelRoute {
  if (explicitModel) {
    return { purpose, model: explicitModel, reason: 'Explicit model override' };
  }

  const fast = process.env.AI_MODEL_FAST || 'gemini-flash-lite-latest';
  const smart = process.env.AI_MODEL_SMART || 'gemini-flash-lite-latest';
  const agent = process.env.AI_MODEL_AGENT || 'gemini-flash-lite-latest';
  const research = process.env.AI_MODEL_RESEARCH || fast;

  switch (purpose) {
    case 'FAST':
    case 'MEMORY':
      return { purpose, model: fast, reason: 'Low-latency/high-frequency workload' };
    case 'AGENT':
      return { purpose, model: agent, reason: 'Multi-step agent/tool workload' };
    case 'RESEARCH':
      return { purpose, model: research, reason: 'Research and synthesis workload' };
    case 'SYNTHESIS':
      return { purpose, model: smart, reason: 'High-quality synthesis workload' };
    case 'CHAT':
    default:
      return { purpose: 'CHAT', model: smart, reason: 'General conversational reasoning' };
  }
}
