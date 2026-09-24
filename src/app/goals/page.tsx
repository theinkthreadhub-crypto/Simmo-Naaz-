'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Target className="w-4 h-4" /> MENTRA STRATEGIC ENGINE
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Macro Goals & Milestones</h1>
            <p className="text-slate-400 text-sm mt-1">
              Break down ambitious business and personal targets into sequential execution stages with automated milestone XP.
            </p>
          </div>

          <CommandBar />

          <div className="space-y-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-6 sm:p-8 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                        {goal.category}
                      </span>
                      <span className="text-slate-400">• STATUS: {goal.status}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{goal.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{goal.description}</p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-slate-400 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <span>TARGET: {goal.targetDate}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>AGGREGATE COMPLETION</span>
                    <span className="text-cyan-400 font-bold">{goal.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                    Sequential Milestones
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {goal.milestones.map((ms, idx) => (
                      <div
                        key={ms.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between ${
                          ms.completed
                            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                            : 'bg-white/[0.02] border-white/10 text-slate-400'
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
                        <h5 className="text-xs font-semibold text-slate-100 mb-2 leading-tight">
                          {ms.title}
                        </h5>
                        <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
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

      <MobileNav />
    </div>
  );
}
