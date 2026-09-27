'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ResearchDepth, ResearchReport } from '@/lib/research/types';

interface StoredRun {
  id: string;
  topic: string;
  objective?: string;
  depth: ResearchDepth;
  status: string;
  summary?: string;
  created_at: string;
}

export default function ResearchPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('STANDARD');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [runs, setRuns] = useState<StoredRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/research', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Research history could not be loaded.');
      setRuns(data.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research history could not be loaded.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadRun = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Research report could not be loaded.');
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research report could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const runId = searchParams.get('run');
    if (runId) loadRun(runId);
  }, []);

  const runResearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), objective: objective.trim() || undefined, depth })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Live research failed.');
      setReport(data.report);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Live research failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-7">
      <div className="border-b border-white/10 pb-4">
        <div className="text-xs font-mono tracking-widest text-mentra-amber">LIVE WEB + SOURCE CITATIONS</div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Research Intelligence</h1>
        <p className="mt-2 text-sm text-white/45 max-w-2xl">
          MENTRA searches the live public web, keeps source URLs, and refuses to invent a report when no evidence is retrieved.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      <form onSubmit={runResearch} className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-black/50 space-y-4">
        <div className="grid lg:grid-cols-[1fr_180px] gap-3">
          <input
            required
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Research topic — e.g. oversized T-shirt trends India 2026"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
          />
          <select value={depth} onChange={e => setDepth(e.target.value as ResearchDepth)} className="bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 text-white">
            <option>QUICK</option>
            <option>STANDARD</option>
            <option>DEEP</option>
          </select>
        </div>
        <textarea
          value={objective}
          onChange={e => setObjective(e.target.value)}
          rows={2}
          placeholder="Objective (optional) — what decision should this research support?"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
        />
        <button disabled={loading || !topic.trim()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-mentra-orange text-white text-sm font-semibold disabled:opacity-50">
          <Search className="w-4 h-4" />{loading ? 'Researching live sources…' : 'Run live research'}
        </button>
      </form>

      {report && (
        <section className="space-y-5">
          <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-black/55">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-emerald-300 flex gap-1.5 items-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {report.synthesisMode} • {report.sources.length} LIVE SOURCES
                </div>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">{report.topic}</h2>
              </div>
              <span className="text-[10px] text-white/35">{report.depth}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/75 whitespace-pre-wrap">{report.summary}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {report.keyFindings.map((finding, index) => (
              <div key={index} className="p-5 rounded-2xl border border-white/10 bg-black/45">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{finding.topic}</h3>
                  <span className="text-[9px] font-mono text-mentra-amber">{finding.confidence}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{finding.insight}</p>
                <div className="mt-3 text-[10px] text-white/35">Sources: {finding.sources.join(', ')}</div>
              </div>
            ))}
          </div>

          {report.recommendations.length > 0 && (
            <div className="p-5 rounded-3xl border border-white/10 bg-black/45">
              <h3 className="text-sm font-semibold text-white">Evidence-based next steps</h3>
              <div className="mt-3 space-y-2">
                {report.recommendations.map((item, index) => <div key={index} className="text-sm text-white/65">{index + 1}. {item}</div>)}
              </div>
            </div>
          )}

          <div className="p-5 rounded-3xl border border-white/10 bg-black/45">
            <h3 className="text-sm font-semibold text-white">Sources</h3>
            <div className="mt-3 space-y-3">
              {report.sources.map(source => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-mentra-amber">{source.id} • {source.domain}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{source.title}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/35 flex-shrink-0" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/50">{source.snippet}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="p-5 rounded-3xl border border-white/10 bg-black/40">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Research history</h2>
          <button onClick={loadHistory} disabled={historyLoading} className="p-2 rounded-xl bg-white/5">
            <RefreshCw className={`w-4 h-4 text-white/55 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {!historyLoading && runs.length === 0 && <div className="text-sm text-white/35 py-4">No research runs stored yet.</div>}
          {runs.map(run => (
            <button key={run.id} onClick={() => loadRun(run.id)} className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{run.topic}</div>
                <div className="text-[10px] text-white/35 mt-1">{run.depth} • {run.status} • {new Date(run.created_at).toLocaleString()}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
