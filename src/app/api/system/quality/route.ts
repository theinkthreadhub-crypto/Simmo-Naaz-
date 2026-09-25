import { NextResponse } from 'next/server';
import { getAgentQualityMetrics, getDetectedSystemIssues } from '@/lib/evals/agentQuality';
import { evaluateGoldenCases } from '@/lib/evals/goldenEvaluator';
import { PROMPT_REGISTRY } from '@/lib/ai/prompts/registry';

export async function GET() {
  const agentMetrics = getAgentQualityMetrics();
  const systemIssues = getDetectedSystemIssues();
  const goldenEvals = await evaluateGoldenCases();

  const promptFamilies = Object.keys(PROMPT_REGISTRY).map(family => {
    const versions = Object.values(PROMPT_REGISTRY[family]);
    const active = versions.find(v => v.isActive);
    return {
      family,
      activeVersion: active?.version || 'v1.0.0',
      totalVersions: versions.length,
      notes: active?.notes || ''
    };
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    agentMetrics,
    systemIssues,
    goldenEvals,
    promptFamilies
  });
}
