'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, LoaderCircle, RotateCcw, TriangleAlert } from 'lucide-react';
import { SUB_AGENT_IDS, SUB_AGENT_PROFILES } from '@/lib/agents/lead/profiles';
import RunTimeline, { AGENT_ICONS } from './RunTimeline';
import {
  LeadRun,
  TONE_DOT,
  TONE_TEXT,
  formatDuration,
  isRunActive,
  isStaleRun,
  plainText,
  runStatusLabel,
  runTone,
  timeAgo
} from './runTypes';

const EXAMPLES = [
  'Streetwear t-shirt trends research karo aur 5 print ideas do',
  'Is mahine ka kharch dekho aur bachat ka plan banao',
  'Aaj ki meetings aur zaroori unread emails batao'
];

const POLL_MS = 2500;

export default function LeadAgentConsole() {
  const [runs, setRuns] = useState<LeadRun[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadRuns = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/runs?limit=10', { cache: 'no-store' });
      if (response.status === 401) {
        setError('Sign in to see your agent runs.');
        return;
      }
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not load agent runs.');
      setRuns(Array.isArray(json.runs) ? json.runs : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load agent runs.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const anyActive = runs.some(isRunActive);

  // Poll while something is running, including runs started from chat.
  useEffect(() => {
    if (!anyActive && !submitting) return;
    const poll = setInterval(loadRuns, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [anyActive, submitting, loadRuns]);

  const selected = useMemo(
    () => runs.find(run => run.id === selectedId) ?? runs[0] ?? null,
    [runs, selectedId]
  );

  const waitingApprovals = runs.filter(run => run.status === 'WAITING_APPROVAL').length;

  async function startRun(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 3 || submitting) return;

    setSubmitting(true);
    setError(null);
    setSelectedId(null); // follow the newest run
    const firstPoll = setTimeout(loadRuns, 1200);

    try {
      const response = await fetch('/api/agents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed })
      });
      const json = await response.json().catch(() => ({}));

      if (response.status === 504) {
        throw new Error('The run took longer than the server allows. Set AI_LEAD_AGENT_TIME_BUDGET_MS to 50000 in Vercel and try again.');
      }
      if (!response.ok) throw new Error(json.error || `The run could not start (error ${response.status}).`);

      setQuery('');
      if (json.runId) setSelectedId(json.runId);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'The run could not start.');
    } finally {
      clearTimeout(firstPoll);
      setSubmitting(false);
      loadRuns();
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      startRun(query);
    }
  }

  const liveElapsed =
    selected && isRunActive(selected) && selected.startedAt
      ? formatDuration(now - new Date(selected.startedAt).getTime())
      : '';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-8">
        {/* Composer */}
        <form
          onSubmit={event => {
            event.preventDefault();
            startRun(query);
          }}
          className="rounded-3xl border border-mentra-hairline-orange bg-mentra-glass-strong p-5 sm:p-6"
        >
          <label htmlFor="lead-query" className="block font-serif text-2xl leading-tight text-white sm:text-3xl">
            What should MENTRA work on?
          </label>
          <textarea
            id="lead-query"
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            maxLength={2000}
            disabled={submitting}
            placeholder="Describe the goal. MENTRA plans it, splits it between agents, and asks before anything risky."
            className="mt-4 w-full resize-none rounded-2xl border border-mentra-hairline bg-black/30 px-4 py-3 text-base text-white placeholder:text-mentra-muted focus:border-mentra-amber focus:outline-none focus:ring-2 focus:ring-mentra-amber/40 disabled:opacity-60"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(example => (
                <button
                  key={example}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setQuery(example);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-mentra-hairline px-3 py-1.5 text-left text-xs text-mentra-text-secondary hover:border-mentra-amber/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mentra-amber disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || query.trim().length < 3}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-mentra-orange px-5 py-3 text-sm font-semibold text-white hover:bg-mentra-amber hover:text-mentra-bg-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
                  Running
                </>
              ) : (
                <>
                  Start run
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-mentra-rose/10 px-3 py-2 text-sm text-rose-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-mentra-rose" aria-hidden />
              {error}
            </p>
          )}
        </form>

        {/* Selected run */}
        <section aria-live="polite" className="rounded-3xl border border-mentra-hairline bg-mentra-glass p-5 sm:p-6">
          {!loaded ? (
            <div className="flex items-center gap-2 text-sm text-mentra-muted">
              <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
              Loading runs
            </div>
          ) : !selected ? (
            <div className="py-6">
              <h2 className="font-display text-lg font-semibold text-white">No runs yet</h2>
              <p className="mt-1 max-w-prose text-sm text-mentra-text-secondary">
                Start one above. You will see the plan, each agent working, and the final answer here.
              </p>
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">{selected.query}</h2>
                  <p className={`mt-1 inline-flex items-center gap-2 text-sm ${TONE_TEXT[runTone(selected)]}`}>
                    <span
                      className={`h-2 w-2 rounded-full ${TONE_DOT[runTone(selected)]} ${isRunActive(selected) ? 'motion-safe:animate-pulse' : ''}`}
                    />
                    {runStatusLabel(selected)}
                    {liveElapsed && <span className="text-mentra-muted">for {liveElapsed}</span>}
                    {!isRunActive(selected) && selected.durationMs ? (
                      <span className="text-mentra-muted">in {formatDuration(selected.durationMs)}</span>
                    ) : null}
                  </p>
                </div>
                {!isRunActive(selected) && (
                  <button
                    type="button"
                    onClick={() => startRun(selected.query)}
                    disabled={submitting}
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-mentra-hairline px-3 py-2 text-xs text-mentra-text-secondary hover:border-mentra-amber/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mentra-amber disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Run again
                  </button>
                )}
              </header>

              <div className="mt-6">
                {selected.plan?.steps?.length ? (
                  <RunTimeline planSteps={selected.plan.steps} steps={selected.steps} />
                ) : (
                  <p className="flex items-center gap-2 text-sm text-mentra-muted">
                    {isRunActive(selected) && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden />}
                    {isRunActive(selected) ? 'Making a plan' : 'No plan was saved for this run.'}
                  </p>
                )}
              </div>

              {selected.status === 'WAITING_APPROVAL' && (
                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-mentra-amber/40 bg-mentra-orange/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white">An agent prepared an action that needs your OK before it runs.</p>
                  <Link
                    href="/approvals"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-mentra-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mentra-amber hover:text-mentra-bg-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Review approval
                  </Link>
                </div>
              )}

              {isStaleRun(selected) && (
                <p className="mt-6 text-sm text-rose-200">
                  This run stopped before finishing, most likely because the server time limit was reached. Run it again or lower AI_LEAD_AGENT_TIME_BUDGET_MS.
                </p>
              )}

              {selected.summary && !isRunActive(selected) && (
                <article className="mt-8 border-t border-mentra-hairline pt-6">
                  <h3 className="font-serif text-2xl text-white">Answer</h3>
                  <p className="mt-3 max-w-prose whitespace-pre-wrap text-[15px] leading-7 text-mentra-text-secondary">
                    {plainText(selected.summary)}
                  </p>
                  {selected.usage?.totalTokens ? (
                    <p className="mt-4 text-xs text-mentra-muted">
                      {selected.usage.totalTokens.toLocaleString('en-IN')} tokens used
                      {selected.plan?.source === 'FALLBACK' ? ', basic plan (AI planner unavailable)' : ''}
                    </p>
                  ) : null}
                </article>
              )}
            </>
          )}
        </section>
      </div>

      {/* Side column */}
      <aside className="space-y-6 lg:col-span-4">
        <section className="rounded-3xl border border-mentra-hairline bg-mentra-glass p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold text-white">Recent runs</h2>
            {waitingApprovals > 0 && (
              <Link href="/approvals" className="text-xs text-mentra-amber-soft underline-offset-4 hover:underline">
                {waitingApprovals} waiting for you
              </Link>
            )}
          </div>

          {runs.length === 0 ? (
            <p className="mt-3 text-sm text-mentra-muted">Your runs will be listed here.</p>
          ) : (
            <ul className="mt-3 -mx-2 space-y-1">
              {runs.map(run => {
                const isSelected = selected?.id === run.id;
                const tone = runTone(run);
                return (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(run.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={[
                        'w-full rounded-xl px-2 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mentra-amber',
                        isSelected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                      ].join(' ')}
                    >
                      <span className="line-clamp-2 text-sm text-white">{run.query}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1.5 ${TONE_TEXT[tone]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
                          {runStatusLabel(run)}
                        </span>
                        <span className="text-mentra-muted">{timeAgo(run.startedAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-mentra-hairline bg-mentra-glass p-5">
          <h2 className="font-display text-base font-semibold text-white">Your agent team</h2>
          <p className="mt-1 text-sm text-mentra-muted">MENTRA picks who works on each run.</p>
          <ul className="mt-4 space-y-3">
            {SUB_AGENT_IDS.map(id => {
              const profile = SUB_AGENT_PROFILES[id];
              const Icon = AGENT_ICONS[id];
              return (
                <li key={id} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-mentra-amber">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{profile.title}</span>
                    <span className="block text-xs leading-snug text-mentra-muted">{profile.description}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </div>
  );
}
