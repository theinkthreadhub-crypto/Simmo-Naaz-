'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Target,
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Bot,
  Zap,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface Step {
  id: string;
  step_index: number;
  step_type: string;
  title: string;
  description: string;
  agent?: string;
  tool?: string;
  status: 'PENDING' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETE' | 'FAILED' | 'SKIPPED';
  requires_approval: boolean;
  output?: Record<string, unknown>;
}

interface MissionDetail {
  id: string;
  title: string;
  objective: string;
  timeline_days: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  total_xp: number;
  plan?: {
    id: string;
    status: string;
    steps: Step[];
  };
}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [executingStep, setExecutingStep] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    try {
      const res = await fetch(`/api/missions/${params.id}`);
      const data = await res.json();
      if (data.success && data.mission) {
        setMission(data.mission);
      }
    } catch (e) {
      console.error('Failed to load mission details:', e);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchMission();
    }
  }, [params.id, fetchMission]);

  const handleExecuteStep = async (stepIndex: number) => {
    if (!mission?.plan?.id) return;
    setExecutingStep(stepIndex);
    setToast(null);

    try {
      const res = await fetch(`/api/missions/${mission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE_STEP', stepIndex, planId: mission.plan.id })
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.message);
        await fetchMission();
      } else {
        setToast(data.error || 'Step execution failed.');
      }
    } catch {
      setToast('Network error executing step.');
    } finally {
      setExecutingStep(null);
    }
  };

  const handleTogglePause = async () => {
    if (!mission) return;
    const nextAction = mission.status === 'ACTIVE' ? 'PAUSE' : 'RESUME';
    try {
      const res = await fetch(`/api/missions/${mission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction })
      });
      const data = await res.json();
      if (data.success) {
        setMission({ ...mission, status: data.status });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !mission) {
    return (
      <div className="min-h-screen bg-black text-slate-100 pb-28">
        <PillNavbar />
        <div className="text-center py-40 font-mono text-xs text-slate-500">
          LOADING MISSION GRAPH...
        </div>
      </div>
    );
  }

  const steps = mission.plan?.steps || [];
  const completedSteps = steps.filter((s) => s.status === 'COMPLETE').length;

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => router.push('/missions')}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO MISSION CONTROL</span>
        </button>

        {/* Mission Overview Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                mission.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {mission.status}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {mission.timeline_days} DAY OBJECTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {mission.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {mission.objective}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePause}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-200 transition-all flex items-center gap-2"
            >
              {mission.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{mission.status === 'ACTIVE' ? 'PAUSE MISSION' : 'RESUME MISSION'}</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="p-4 rounded-xl mb-6 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Task Graph DAG Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-mono uppercase tracking-widest text-mentra-amber flex items-center gap-2">
              <Bot className="w-4 h-4 text-mentra-orange" />
              <span>AUTONOMOUS EXECUTION GRAPH ({completedSteps}/{steps.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {steps.map((step) => {
              const isExecuting = executingStep === step.step_index;
              const isComplete = step.status === 'COMPLETE';
              const isWaiting = step.status === 'WAITING_APPROVAL';

              return (
                <div
                  key={step.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isComplete
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                      : isWaiting
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
                      isComplete
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isWaiting
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.step_index}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {step.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {step.agent || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {step.description}
                      </p>

                      {step.output && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300">
                          Result: {JSON.stringify(step.output)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isWaiting ? (
                      <a
                        href="/approvals"
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize Action</span>
                      </a>
                    ) : !isComplete ? (
                      <button
                        onClick={() => handleExecuteStep(step.step_index)}
                        disabled={isExecuting}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isExecuting ? 'Executing...' : 'Run Step'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
