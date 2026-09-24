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
  CircleDot
} from 'lucide-react';

export default function GoalsPage() {
  const goals = useMentraStore((state) => state.goals);

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <Target className="w-4 h-4" /> MENTRA STRATEGIC ENGINE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Macro Goals & Milestones</h1>
          <p className="text-white/60 text-sm mt-1">
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
              className="p-6 sm:p-8 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl space-y-6"
            >
              {/* Goal Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#ff8a1f] mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ff3d00]/20 border border-[#ff3d00]/30">
                      {goal.category}
                    </span>
                    <span className="text-white/50">• STATUS: {goal.status}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{goal.title}</h2>
                  <p className="text-xs sm:text-sm text-white/60 mt-1">{goal.description}</p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-white/60 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10">
                  <Calendar className="w-4 h-4 text-[#ff8a1f]" />
                  <span>TARGET: {goal.targetDate}</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div>
                <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                  <span>AGGREGATE COMPLETION</span>
                  <span className="text-[#ff8a1f] font-bold">{goal.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a1f] rounded-full transition-all duration-500"
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Milestones Horizontal Steps */}
              <div>
                <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
                  Sequential Milestones
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {goal.milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        ms.completed
                          ? 'bg-[#ff3d00]/20 border-[#ff8a1f]/50 text-amber-100'
                          : 'bg-white/[0.03] border-white/10 text-white/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono">PHASE 0{idx + 1}</span>
                        {ms.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#ff8a1f] flex-shrink-0" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-white/20 flex-shrink-0" />
                        )}
                      </div>
                      <h5 className="text-xs font-semibold text-slate-100 mb-2 leading-tight">
                        {ms.title}
                      </h5>
                      <div className="text-[10px] font-mono text-[#ff8a1f] flex items-center gap-1">
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
