import type { SubAgentId } from '@/lib/agents/lead/profiles';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'PARTIAL'
  | 'WAITING_APPROVAL'
  | 'FAILED'
  | 'SKIPPED';

export type RunStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'RUNNING'
  | 'COMPLETE'
  | 'PARTIAL'
  | 'WAITING_APPROVAL'
  | 'FAILED'
  | 'CANCELLED';

export interface RunPlanStep {
  id: string;
  agent: SubAgentId;
  title: string;
  instruction: string;
  dependsOn: string[];
}

export interface RunStep {
  id: string;
  agent: SubAgentId;
  title: string;
  status: StepStatus;
  output?: string;
  executedTools?: string[];
  toolCalls?: number;
  latencyMs?: number;
  error?: string;
}

export interface LeadRun {
  id: string;
  title: string;
  query: string;
  status: RunStatus;
  stage: string | null;
  plan: { goal: string; steps: RunPlanStep[]; source: 'AI' | 'FALLBACK' } | null;
  steps: RunStep[];
  summary: string | null;
  usage: { totalTokens: number } | null;
  durationMs: number | null;
  approvalId: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export const ACTIVE_RUN_STATUSES = new Set<RunStatus>(['QUEUED', 'PLANNING', 'RUNNING']);

/** A run still marked active after 5 minutes was cut off by the server timeout. */
export function isStaleRun(run: LeadRun): boolean {
  if (!ACTIVE_RUN_STATUSES.has(run.status) || !run.startedAt) return false;
  return Date.now() - new Date(run.startedAt).getTime() > 5 * 60 * 1000;
}

export function isRunActive(run: LeadRun): boolean {
  return ACTIVE_RUN_STATUSES.has(run.status) && !isStaleRun(run);
}

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  PENDING: 'Queued',
  RUNNING: 'Working',
  SUCCESS: 'Done',
  PARTIAL: 'Partly done',
  WAITING_APPROVAL: 'Needs your OK',
  FAILED: 'Failed',
  SKIPPED: 'Skipped'
};

export function runStatusLabel(run: LeadRun): string {
  if (isStaleRun(run)) return 'Stopped';
  switch (run.status) {
    case 'QUEUED':
    case 'PLANNING':
      return 'Planning';
    case 'RUNNING':
      return run.stage === 'SYNTHESIZING' ? 'Writing answer' : 'Working';
    case 'COMPLETE':
      return 'Done';
    case 'PARTIAL':
      return 'Partly done';
    case 'WAITING_APPROVAL':
      return 'Needs your OK';
    case 'FAILED':
      return 'Failed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return run.status;
  }
}

/** Tone keys map to one colour each, used by dots and text. */
export type Tone = 'idle' | 'live' | 'done' | 'warn' | 'fail';

export function stepTone(status: StepStatus): Tone {
  if (status === 'RUNNING') return 'live';
  if (status === 'SUCCESS') return 'done';
  if (status === 'PARTIAL' || status === 'WAITING_APPROVAL') return 'warn';
  if (status === 'FAILED') return 'fail';
  return 'idle';
}

export function runTone(run: LeadRun): Tone {
  if (isStaleRun(run)) return 'fail';
  if (ACTIVE_RUN_STATUSES.has(run.status)) return 'live';
  if (run.status === 'COMPLETE') return 'done';
  if (run.status === 'PARTIAL' || run.status === 'WAITING_APPROVAL') return 'warn';
  if (run.status === 'FAILED') return 'fail';
  return 'idle';
}

export const TONE_DOT: Record<Tone, string> = {
  idle: 'bg-white/25',
  live: 'bg-mentra-amber',
  done: 'bg-mentra-emerald',
  warn: 'bg-mentra-amber-soft',
  fail: 'bg-mentra-rose'
};

export const TONE_TEXT: Record<Tone, string> = {
  idle: 'text-mentra-muted',
  live: 'text-mentra-amber',
  done: 'text-mentra-emerald',
  warn: 'text-mentra-amber-soft',
  fail: 'text-mentra-rose'
};

/**
 * Groups plan steps into waves: every step in a wave can run at the same time
 * because everything it depends on finished in an earlier wave.
 */
export function toWaves(planSteps: RunPlanStep[]): RunPlanStep[][] {
  const level = new Map<string, number>();
  const ids = new Set(planSteps.map(step => step.id));

  for (let pass = 0; pass < planSteps.length + 1; pass++) {
    let changed = false;
    for (const step of planSteps) {
      const deps = step.dependsOn.filter(dep => ids.has(dep) && dep !== step.id);
      const next = deps.length === 0 ? 0 : Math.max(...deps.map(dep => (level.get(dep) ?? 0) + 1));
      if (level.get(step.id) !== next) {
        level.set(step.id, Math.min(next, planSteps.length));
        changed = true;
      }
    }
    if (!changed) break;
  }

  const waves: RunPlanStep[][] = [];
  for (const step of planSteps) {
    const index = level.get(step.id) ?? 0;
    (waves[index] ||= []).push(step);
  }
  return waves.filter(Boolean);
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 0) return '';
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Model answers use light markdown; the UI shows them as clean plain text. */
export function plainText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}
