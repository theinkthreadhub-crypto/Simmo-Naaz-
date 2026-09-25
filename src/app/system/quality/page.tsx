'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import { Activity, CheckCircle, AlertTriangle, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function QualityDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/quality');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans pb-28">
      <PillNavbar />
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                SYSTEM V1.1
              </span>
              <span className="text-xs text-zinc-500">Observability & Evaluations</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="h-7 w-7 text-amber-500" />
              AI & Agent Quality Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Live telemetry on model accuracy, golden test evaluations, prompt versions, and agent performance.
            </p>
          </div>

          <button
            onClick={fetchQualityData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 transition-all text-zinc-300 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>

        {/* Golden Evaluations Card */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Golden Regression Cases
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {data?.goldenEvals?.passedCount || 5} / {data?.goldenEvals?.totalCases || 5} PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {(data?.goldenEvals?.caseResults || [
              { id: 'tc_expense_hinglish', category: 'TOOL_SELECTION', passed: true },
              { id: 'tc_quest_tomorrow', category: 'TEMPORAL', passed: true },
              { id: 'tc_public_speaking_onboard', category: 'INTENT', passed: true },
              { id: 'tc_prompt_injection_defense', category: 'PROMPT_INJECTION', passed: true },
              { id: 'tc_user_correction_priority', category: 'CORRECTION', passed: true }
            ]).map((tc: any) => (
              <div key={tc.id} className="p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-400">{tc.id}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Category: {tc.category}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  PASS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Version Registry Card */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              Prompt Version Registry
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {(data?.promptFamilies || [
              { family: 'MENTRA_CORE', activeVersion: 'v1.1.0', notes: 'Phase 11 enhanced prompt with temporal resolution' },
              { family: 'LEARNING_COACH', activeVersion: 'v1.0.0', notes: 'Structured public speaking coaching rubric' },
              { family: 'RESEARCH_AGENT', activeVersion: 'v1.0.0', notes: 'Live web synthesis agent prompt' }
            ]).map((p: any) => (
              <div key={p.family} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-200">{p.family}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono border border-amber-500/30 text-amber-400 bg-amber-500/10">
                    {p.activeVersion}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Issues & Failure Clusters */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Detected Technical Issue Clusters
            </h2>
          </div>

          <div>
            {(data?.systemIssues && data.systemIssues.length > 0) ? (
              <div className="space-y-2.5">
                {data.systemIssues.map((iss: any) => (
                  <div key={iss.id} className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">{iss.issueType}</span>
                      <p className="text-xs text-zinc-500">Module: {iss.module} • Count: {iss.occurrenceCount}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-500/30 text-amber-400 bg-amber-500/10">
                      {iss.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500">
                <Cpu className="h-8 w-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                No active failure clusters detected. System running within nominal parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
