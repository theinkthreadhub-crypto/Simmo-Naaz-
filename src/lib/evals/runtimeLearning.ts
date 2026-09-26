import { createClient } from '@/lib/supabase/server';

export interface RuntimeTraceLike {
  status: string;
  tool?: string;
  latencyMs?: number;
}

export interface RuntimeEvaluationInput {
  userId: string;
  aiRunId: string;
  runStatus: string;
  responseText: string;
  traces?: RuntimeTraceLike[];
  maxStepsReached?: boolean;
}

export interface RuntimeQualitySummary {
  recentRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgLatencyMs: number;
  providers: Array<{
    provider: string;
    model: string;
    total: number;
    successRate: number;
    avgLatencyMs: number;
  }>;
  tools: Array<{
    tool: string;
    total: number;
    successRate: number;
    avgLatencyMs: number;
  }>;
}

export async function evaluateRunAndPersist(
  input: RuntimeEvaluationInput
): Promise<void> {
  if (process.env.AI_TRACE_LEARNING !== 'true') return;

  const traces = input.traces || [];
  const toolAttempts = traces.filter(trace =>
    [
      'SUCCESS',
      'FAILED',
      'VALIDATION_FAILED',
      'LOOP_BLOCKED',
      'UNKNOWN_TOOL'
    ].includes(trace.status)
  );
  const toolSuccesses = toolAttempts.filter(
    trace => trace.status === 'SUCCESS'
  ).length;

  const toolSuccessRate =
    toolAttempts.length === 0
      ? 1
      : toolSuccesses / toolAttempts.length;

  const approvalWait =
    input.runStatus === 'WAITING_APPROVAL' ||
    traces.some(trace => trace.status === 'APPROVAL_REQUIRED');

  const flags: string[] = [];

  if (!input.responseText.trim()) flags.push('EMPTY_RESPONSE');
  if (input.maxStepsReached) flags.push('MAX_STEPS_REACHED');
  if (toolSuccessRate < 1) flags.push('TOOL_FAILURE');
  if (approvalWait) flags.push('APPROVAL_WAIT');
  if (input.runStatus === 'FAILED') flags.push('RUN_FAILED');

  let score = 1;
  if (!input.responseText.trim()) score -= 0.25;
  if (input.maxStepsReached) score -= 0.15;
  if (input.runStatus === 'FAILED') score -= 0.45;
  if (input.runStatus === 'PARTIAL') score -= 0.2;
  score -= (1 - toolSuccessRate) * 0.35;

  // Waiting for approval is safe behavior, not a failure.
  if (approvalWait && input.runStatus === 'WAITING_APPROVAL') {
    score = Math.max(score, 0.8);
  }

  score = Math.max(0, Math.min(1, score));

  const supabase = createClient();
  await supabase.from('ai_run_evaluations').upsert({
    user_id: input.userId,
    ai_run_id: input.aiRunId,
    quality_score: score,
    tool_success_rate: toolSuccessRate,
    completed:
      input.runStatus === 'SUCCESS' ||
      input.runStatus === 'PARTIAL',
    max_steps_reached: Boolean(input.maxStepsReached),
    approval_wait: approvalWait,
    flags,
    summary: {
      responseLength: input.responseText.length,
      toolAttempts: toolAttempts.length,
      toolSuccesses
    }
  }, { onConflict: 'ai_run_id' });
}

export async function getRuntimeQualitySummary(
  userId: string,
  limit: number = 100
): Promise<RuntimeQualitySummary> {
  const supabase = createClient();
  const safeLimit = Math.max(10, Math.min(limit, 250));

  const [{ data: runs }, { data: tools }] = await Promise.all([
    supabase
      .from('ai_runs')
      .select('provider, model, status, latency_ms, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(safeLimit),
    supabase
      .from('ai_tool_calls')
      .select('tool_name, status, latency_ms, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(safeLimit * 4)
  ]);

  const runRows = runs || [];
  const toolRows = tools || [];

  const providerMap = new Map<string, {
    provider: string;
    model: string;
    total: number;
    success: number;
    latency: number;
  }>();

  for (const run of runRows) {
    const key = String(run.provider) + '::' + String(run.model);
    const item = providerMap.get(key) || {
      provider: String(run.provider),
      model: String(run.model),
      total: 0,
      success: 0,
      latency: 0
    };

    item.total++;
    if (run.status === 'SUCCESS') item.success++;
    item.latency += Number(run.latency_ms || 0);
    providerMap.set(key, item);
  }

  const toolMap = new Map<string, {
    tool: string;
    total: number;
    success: number;
    latency: number;
  }>();

  for (const call of toolRows) {
    const key = String(call.tool_name);
    const item = toolMap.get(key) || {
      tool: key,
      total: 0,
      success: 0,
      latency: 0
    };

    item.total++;
    if (call.status === 'SUCCESS') item.success++;
    item.latency += Number(call.latency_ms || 0);
    toolMap.set(key, item);
  }

  const successfulRuns = runRows.filter(
    run => run.status === 'SUCCESS'
  ).length;

  return {
    recentRuns: runRows.length,
    successfulRuns,
    failedRuns: runRows.length - successfulRuns,
    avgLatencyMs:
      runRows.length === 0
        ? 0
        : Math.round(
            runRows.reduce(
              (sum, run) => sum + Number(run.latency_ms || 0),
              0
            ) / runRows.length
          ),
    providers: Array.from(providerMap.values())
      .map(item => ({
        provider: item.provider,
        model: item.model,
        total: item.total,
        successRate:
          item.total === 0 ? 0 : item.success / item.total,
        avgLatencyMs:
          item.total === 0
            ? 0
            : Math.round(item.latency / item.total)
      }))
      .sort((a, b) => b.total - a.total),
    tools: Array.from(toolMap.values())
      .map(item => ({
        tool: item.tool,
        total: item.total,
        successRate:
          item.total === 0 ? 0 : item.success / item.total,
        avgLatencyMs:
          item.total === 0
            ? 0
            : Math.round(item.latency / item.total)
      }))
      .sort((a, b) => b.total - a.total)
  };
}
