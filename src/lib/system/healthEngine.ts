import { createClient } from '@/lib/supabase/server';
import { auditEnvironment } from '@/lib/config/envValidator';
import { getAllCircuitStates } from '@/lib/safety/circuitBreaker';
import { getRuntimeQualitySummary } from '@/lib/evals/runtimeLearning';

export type HealthLevel =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'CRITICAL'
  | 'UNKNOWN'
  | 'DISABLED';

export interface HealthComponent {
  key: string;
  name: string;
  level: HealthLevel;
  message: string;
  metrics?: Record<string, number | string | boolean | null>;
}

function worstLevel(components: HealthComponent[]): HealthLevel {
  if (components.some(component => component.level === 'CRITICAL')) return 'CRITICAL';
  if (components.some(component => component.level === 'DEGRADED')) return 'DEGRADED';
  if (components.some(component => component.level === 'HEALTHY')) return 'HEALTHY';
  if (components.every(component => component.level === 'DISABLED')) return 'DISABLED';
  return 'UNKNOWN';
}

export async function getSystemHealthSnapshot(userId?: string) {
  const envAudit = auditEnvironment();
  const circuits = getAllCircuitStates();
  const components: HealthComponent[] = [];

  components.push({
    key: 'core',
    name: 'Core Environment',
    level: envAudit.isValidCore ? 'HEALTHY' : 'CRITICAL',
    message: envAudit.isValidCore
      ? 'Core environment variables are available.'
      : 'Core environment configuration is incomplete.',
    metrics: {
      readyCapabilities: envAudit.summary.readyOrConnected,
      totalCapabilities: envAudit.summary.total
    }
  });

  const aiCapability = envAudit.capabilities.ai_core;
  components.push({
    key: 'ai',
    name: 'AI Runtime',
    level:
      aiCapability?.status === 'CONFIG_REQUIRED' && !process.env.AI_LOCAL_BASE_URL
        ? 'DEGRADED'
        : 'HEALTHY',
    message:
      aiCapability?.status === 'CONFIG_REQUIRED' && !process.env.AI_LOCAL_BASE_URL
        ? 'Cloud/local AI is not configured; deterministic fallback remains available.'
        : process.env.AI_LOCAL_BASE_URL
          ? 'AI routing has local/private inference available.'
          : 'AI runtime provider configuration is available.'
  });

  if (!userId) {
    return {
      status: worstLevel(components),
      timestamp: new Date().toISOString(),
      userScoped: false,
      environment: envAudit.environment,
      capabilities: envAudit.capabilities,
      circuits,
      autoRecoveryEnabled: process.env.SYSTEM_AUTO_RECOVERY !== 'false',
      components
    };
  }

  const supabase = createClient();

  try {
    const quality = await getRuntimeQualitySummary(userId, 100);
    const runRate =
      quality.recentRuns === 0
        ? 1
        : quality.successfulRuns / quality.recentRuns;
    const toolAttempts = quality.tools.reduce((sum, item) => sum + item.total, 0);
    const toolSuccesses = quality.tools.reduce(
      (sum, item) => sum + item.total * item.successRate,
      0
    );
    const toolRate = toolAttempts === 0 ? 1 : toolSuccesses / toolAttempts;

    components.push({
      key: 'runtime_quality',
      name: 'Agent Runtime Reliability',
      level:
        runRate >= 0.9 && toolRate >= 0.9
          ? 'HEALTHY'
          : runRate >= 0.65 && toolRate >= 0.65
            ? 'DEGRADED'
            : 'CRITICAL',
      message:
        quality.recentRuns === 0
          ? 'No completed runtime history yet.'
          : 'Calculated from recent verified AI runs and tool calls.',
      metrics: {
        recentRuns: quality.recentRuns,
        runSuccessRate: Number(runRate.toFixed(3)),
        toolSuccessRate: Number(toolRate.toFixed(3)),
        avgLatencyMs: quality.avgLatencyMs
      }
    });
  } catch {
    components.push({
      key: 'runtime_quality',
      name: 'Agent Runtime Reliability',
      level: 'UNKNOWN',
      message: 'Runtime quality telemetry is not available yet.'
    });
  }

  try {
    const { data: jobs, error } = await supabase
      .from('scheduled_jobs')
      .select('status, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const staleCutoff = Date.now() - 15 * 60 * 1000;
    const failed = (jobs || []).filter(job => job.status === 'FAILED').length;
    const stale = (jobs || []).filter(job =>
      ['CLAIMED', 'RUNNING'].includes(job.status) &&
      new Date(job.updated_at).getTime() < staleCutoff
    ).length;

    components.push({
      key: 'scheduler',
      name: 'Scheduler & Monitors',
      level: stale > 0 ? 'CRITICAL' : failed > 0 ? 'DEGRADED' : 'HEALTHY',
      message:
        stale > 0
          ? 'Stale claimed jobs require recovery.'
          : failed > 0
            ? 'Some scheduled jobs have failed.'
            : 'No stale scheduler claims detected.',
      metrics: {
        trackedJobs: (jobs || []).length,
        failedJobs: failed,
        staleClaims: stale
      }
    });
  } catch {
    components.push({
      key: 'scheduler',
      name: 'Scheduler & Monitors',
      level: 'UNKNOWN',
      message: 'Scheduler telemetry is unavailable.'
    });
  }

  try {
    const { data: approvals, error } = await supabase
      .from('approval_requests')
      .select('status, expires_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const now = Date.now();
    const expiredPending = (approvals || []).filter(item =>
      item.status === 'PENDING' &&
      item.expires_at &&
      new Date(item.expires_at).getTime() <= now
    ).length;
    const stuckExecuting = (approvals || []).filter(item =>
      item.status === 'EXECUTING' &&
      new Date(item.updated_at).getTime() <= now - 15 * 60 * 1000
    ).length;

    components.push({
      key: 'approvals',
      name: 'Approval Safety Gate',
      level:
        stuckExecuting > 0
          ? 'CRITICAL'
          : expiredPending > 0
            ? 'DEGRADED'
            : 'HEALTHY',
      message:
        stuckExecuting > 0
          ? 'An approval is stuck in execution and must fail closed.'
          : expiredPending > 0
            ? 'Expired approvals are waiting for cleanup.'
            : 'Approval gate is within normal state.',
      metrics: {
        trackedApprovals: (approvals || []).length,
        expiredPending,
        stuckExecuting
      }
    });
  } catch {
    components.push({
      key: 'approvals',
      name: 'Approval Safety Gate',
      level: 'UNKNOWN',
      message: 'Approval telemetry is unavailable.'
    });
  }

  try {
    const { data: worker, error } = await supabase
      .from('brain_worker_heartbeats')
      .select('status, last_seen_at')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!worker) {
      components.push({
        key: 'brain_worker',
        name: 'Persistent Brain Worker',
        level: 'DISABLED',
        message: 'No persistent worker heartbeat has been registered.'
      });
    } else {
      const ageMs = Date.now() - new Date(worker.last_seen_at).getTime();
      const level: HealthLevel =
        ageMs <= 3 * 60 * 1000
          ? 'HEALTHY'
          : ageMs <= 10 * 60 * 1000
            ? 'DEGRADED'
            : 'CRITICAL';

      components.push({
        key: 'brain_worker',
        name: 'Persistent Brain Worker',
        level,
        message:
          level === 'HEALTHY'
            ? 'Worker heartbeat is current.'
            : 'Worker heartbeat is stale.',
        metrics: {
          heartbeatAgeSeconds: Math.max(0, Math.round(ageMs / 1000)),
          workerStatus: String(worker.status || 'UNKNOWN')
        }
      });
    }
  } catch {
    components.push({
      key: 'brain_worker',
      name: 'Persistent Brain Worker',
      level: 'UNKNOWN',
      message: 'Worker heartbeat telemetry is not available.'
    });
  }

  try {
    const { data: agents, error } = await supabase
      .from('agent_runtime_state')
      .select('status, checkpointed_at')
      .eq('user_id', userId)
      .order('checkpointed_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const failed = (agents || []).filter(agent => agent.status === 'FAILED').length;
    const waiting = (agents || []).filter(agent => agent.status === 'WAITING_APPROVAL').length;

    components.push({
      key: 'agents',
      name: 'Persistent Agents',
      level: failed > 0 ? 'DEGRADED' : 'HEALTHY',
      message:
        failed > 0
          ? 'Some persistent agents require attention.'
          : 'Persistent agent checkpoints are stable.',
      metrics: {
        trackedAgents: (agents || []).length,
        failedAgents: failed,
        waitingApproval: waiting
      }
    });
  } catch {
    components.push({
      key: 'agents',
      name: 'Persistent Agents',
      level: 'UNKNOWN',
      message: 'Persistent agent telemetry is unavailable.'
    });
  }

  return {
    status: worstLevel(components),
    timestamp: new Date().toISOString(),
    userScoped: true,
    environment: envAudit.environment,
    capabilities: envAudit.capabilities,
    circuits,
    autoRecoveryEnabled: process.env.SYSTEM_AUTO_RECOVERY !== 'false',
    components
  };
}
