'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { formatCurrency } from '@/lib/utils';
import {
  FileText
} from 'lucide-react';

export default function ReportsPage() {
  const player = useMentraStore((state) => state.player);
  const finance = useMentraStore((state) => state.finance);
  const quests = useMentraStore((state) => state.quests);

  const completedQuestsCount = quests.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <FileText className="w-4 h-4" /> MENTRA OPERATIONAL SYNTHESIS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Weekly Executive Report</h1>
          <p className="text-white/60 text-sm mt-1">
            Comprehensive audit of character advancement, quest completion velocity, cash flow, and next cycle targets.
          </p>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Executive Dossier Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-[#ff8a1f]/50 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#ff8a1f] uppercase tracking-widest block">
                DOSSIER REF: MENTRA-WK-38
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Week 38 Operational Briefing</h2>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-white/60">
              OPERATOR: <span className="text-[#ff8a1f] font-bold">{player.codename}</span>
            </div>
          </div>

          {/* Core Metrics Quad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase">LEVEL ADVANCE</span>
              <div className="text-xl font-bold text-[#ff8a1f] mt-1">LV.06 → LV.07</div>
            </div>
            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase">XP HARVESTED</span>
              <div className="text-xl font-bold text-amber-300 mt-1">+870 XP</div>
            </div>
            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase">MISSIONS EXECUTED</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{completedQuestsCount} / {quests.length}</div>
            </div>
            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase">MONTHLY RUN-RATE</span>
              <div className="text-xl font-bold text-white mt-1">{formatCurrency(finance.monthlyIncome)}</div>
            </div>
          </div>

          {/* Qualitative Insights */}
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[#ff8a1f] font-bold uppercase">✦ BIGGEST STRATEGIC WIN:</span>
              <p className="text-white/80 font-sans text-sm">
                Successfully locked in 280+ GSM combed cotton fabric supplier contract with 12% lower cost and verified 4.2x ROAS on Meta ads testing batch.
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-rose-400 font-bold uppercase">✦ IDENTIFIED BOTTLENECK:</span>
              <p className="text-white/80 font-sans text-sm">
                Packaging lead time delayed sample fulfillment by 48 hours. Buffer order protocol now enacted in memory vault.
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-emerald-400 font-bold uppercase">✦ NEXT CYCLE PRIORITY OBJECTIVE:</span>
              <p className="text-white/80 font-sans text-sm">
                Scale campaign spend to ₹1,500/day while preserving $\ge 3.8x$ ROAS and launch automated multi-agent content pipeline.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
