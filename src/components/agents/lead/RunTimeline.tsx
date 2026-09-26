'use client';

import React, { useState } from 'react';
import {
  Brain,
  Briefcase,
  CalendarDays,
  ChevronDown,
  FolderOpen,
  GraduationCap,
  LoaderCircle,
  Mail,
  Search,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { SUB_AGENT_PROFILES, type SubAgentId } from '@/lib/agents/lead/profiles';
import {
  RunPlanStep,
  RunStep,
  STEP_STATUS_LABEL,
  TONE_DOT,
  TONE_TEXT,
  formatDuration,
  plainText,
  stepTone,
  toWaves
} from './runTypes';

export const AGENT_ICONS: Record<SubAgentId, LucideIcon> = {
  research: Search,
  business: Briefcase,
  finance: Wallet,
  memory: Brain,
  calendar: CalendarDays,
  gmail: Mail,
  drive: FolderOpen,
  learning: GraduationCap
};

function StepCard({ plan, step }: { plan: RunPlanStep; step?: RunStep }) {
  const [open, setOpen] = useState(false);
  const status = step?.status ?? 'PENDING';
  const tone = stepTone(status);
  const Icon = AGENT_ICONS[plan.agent] ?? Briefcase;
  const profile = SUB_AGENT_PROFILES[plan.agent];
  const hasDetail = Boolean(step?.output || step?.error || step?.executedTools?.length);
  const isLive = status === 'RUNNING';

  return (
    <div
      className={[
        'rounded-2xl border bg-mentra-bg-dark/80 transition-colors',
        isLive ? 'border-mentra-amber/60 shadow-[0_0_0_1px_rgba(103,232,249,0.22),0_0_28px_-8px_rgba(91,108,255,0.6)]' : 'border-mentra-hairline'
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => hasDetail && setOpen(value => !value)}
        aria-expanded={hasDetail ? open : undefined}
        disabled={!hasDetail}
        className="flex w-full items-start gap-3 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mentra-amber disabled:cursor-default"
      >
        <span
          className={[
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            isLive ? 'bg-mentra-orange/20 text-mentra-amber' : 'bg-white/5 text-white/70'
          ].join(' ')}
        >
          {isLive ? <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">{profile?.title ?? plan.agent}</span>
          <span className="mt-0.5 block text-sm leading-snug text-mentra-text-secondary">{plan.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={`inline-flex items-center gap-1.5 ${TONE_TEXT[tone]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]} ${isLive ? 'motion-safe:animate-pulse' : ''}`} />
              {STEP_STATUS_LABEL[status]}
            </span>
            {step?.toolCalls ? <span className="text-mentra-muted">{step.toolCalls} tool {step.toolCalls === 1 ? 'call' : 'calls'}</span> : null}
            {step?.latencyMs ? <span className="text-mentra-muted">{formatDuration(step.latencyMs)}</span> : null}
          </span>
        </span>

        {hasDetail && (
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-mentra-muted transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {open && hasDetail && (
        <div className="border-t border-mentra-hairline px-4 pb-4 pt-3">
          {step?.output && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-mentra-text-secondary">{plainText(step.output)}</p>
          )}
          {step?.error && <p className="mt-2 text-sm text-mentra-rose">{step.error}</p>}
          {step?.executedTools && step.executedTools.length > 0 && (
            <p className="mt-3 text-xs text-mentra-muted">Used: {step.executedTools.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunTimeline({
  planSteps,
  steps
}: {
  planSteps: RunPlanStep[];
  steps: RunStep[];
}) {
  const byId = new Map(steps.map(step => [step.id, step]));
  const waves = toWaves(planSteps);

  return (
    <ol className="relative space-y-5 border-l border-mentra-hairline-orange pl-5 sm:pl-6">
      {waves.map((wave, index) => {
        const waveStatuses = wave.map(step => byId.get(step.id)?.status ?? 'PENDING');
        const waveLive = waveStatuses.includes('RUNNING');
        const waveDone = waveStatuses.every(status => status === 'SUCCESS' || status === 'PARTIAL');

        return (
          <li key={wave.map(step => step.id).join('-')} className="relative">
            <span
              aria-hidden
              className={[
                'absolute -left-[26px] top-5 h-2.5 w-2.5 rounded-full ring-4 ring-mentra-bg-deep sm:-left-[30px]',
                waveLive ? 'bg-mentra-orange motion-safe:animate-pulse' : waveDone ? 'bg-mentra-emerald' : 'bg-white/25'
              ].join(' ')}
            />
            {wave.length > 1 && (
              <p className="mb-2 text-xs text-mentra-muted">
                {index === 0 ? 'Starts with' : 'Then'} {wave.length} agents working at the same time
              </p>
            )}
            <div className={`grid gap-3 ${wave.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {wave.map(step => (
                <StepCard key={step.id} plan={step} step={byId.get(step.id)} />
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
