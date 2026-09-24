'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Target,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  Sparkles,
  Award,
  CircleDot
} from 'lucide-react';

export default function GoalsPage() {
  const goals = useMentraStore((state) => state.goals);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <Target className="w-4 h-4" /> MENTRA STRATEGIC ENGINE
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Macro Goals & Milestones</h1>
          <p className="text-slate-400 text-sm mt-1">
            Break down ambitious business and personal targets into sequential execution stages with automated milestone XP.
          </p>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Goals List */}
        <div className="space-y-6">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="p-6 rounded-2xl bg-[#0d101a]/90 border border-slate-800 shadow-xl backdrop-blur-sm space-y-6"
            >
              {/* Goal Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                      {goal.category}
                    </span>
                    <span className="text-slate-400">• STATUS: {goal.status}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{goal.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{goal.description}</p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span>TARGET: {goal.targetDate}</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>AGGREGATE COMPLETION</span>
                  <span className="text-cyan-400 font-bold">{goal.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Milestones Horizontal / Vertical Steps */}
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Sequential Milestones
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {goal.milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                        ms.completed
                          ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono">PHASE 0{idx + 1}</span>
                        {ms.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                      <h5 className="text-xs font-semibold text-slate-200 mb-2 leading-tight">
                        {ms.title}
                      </h5>
                      <div className="text-[10px] font-mono text-cyan-400/80 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> +{ms.rewardXp} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
