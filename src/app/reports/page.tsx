'use client';

import React from 'react';
import { FileText, TrendingUp, Sparkles, CheckCircle2, Shield, ArrowUpRight, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function ReportsPage() {
  const { user, profile, progress } = useAuth();
  const { player, finance, quests, skills } = useMentraStore();

  const displayLevel = progress?.level ?? player.level;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <FileText className="w-4 h-4 text-mentra-orange" />
            <span>EXECUTIVE DOSSIER & PROGRESSION</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Weekly Intelligence Report
          </h1>
        </div>

        <div className="text-xs font-mono text-white/50">
          STATUS: <strong className="text-emerald-400 font-bold">READY FOR REVIEW</strong>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold font-display text-white">
              WEEKLY OPERATOR DOSSIER // {displayName.toUpperCase()}
            </h2>
            <span className="text-xs font-mono text-white/40">PERIOD: CURRENT ACTIVE CYCLE</span>
          </div>
          <div className="px-3.5 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber font-mono text-xs font-bold">
            LEVEL 0{displayLevel} TACTICIAN
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">QUEST VELOCITY</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">4 / 5 Done</div>
            <p className="text-xs text-emerald-400 font-mono mt-1">+240 XP Accumulated</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">NET CASH FLOW</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">₹{finance.monthlySavings.toLocaleString()}</div>
            <p className="text-xs text-white/50 font-mono mt-1">Solvent Runway: 7.4 mo</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">SKILLS ELEVATED</div>
            <div className="text-2xl font-mono font-bold text-mentra-amber mt-1">2 Nodes</div>
            <p className="text-xs text-mentra-orange font-mono mt-1">AI Agents & Cash Flow</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase">SOVEREIGN STREAK</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">12 Days 🔥</div>
            <p className="text-xs text-emerald-400 font-mono mt-1">Zero Breakdowns</p>
          </div>
        </div>

        {/* AI Synthesis Narrative */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
          <span className="text-xs font-mono text-mentra-amber font-semibold uppercase">
            [MENTRA SYNTHESIS SUMMARY]
          </span>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
            Strong operational momentum this cycle. The Meta Ads unit economics audit stabilized target ROAS at 4.2x while direct fabric negotiations lowered inventory unit cost by 12%. Deep work cadence averaged 4.2 hours daily. Recommend scaling ad budget by 15% next sprint.
          </p>
        </div>
      </div>

    </div>
  );
}
