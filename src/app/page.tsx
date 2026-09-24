'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Shield,
  Zap,
  Target,
  DollarSign,
  Cpu,
  Flame,
  Brain,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Terminal,
  Compass,
  AlertCircle
} from 'lucide-react';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
    </div>
  )
});

export default function Home() {
  const player = useMentraStore((state) => state.player);
  const quests = useMentraStore((state) => state.quests);
  const finance = useMentraStore((state) => state.finance);
  const skills = useMentraStore((state) => state.skills);
  const memories = useMentraStore((state) => state.memories);
  const agents = useMentraStore((state) => state.agents);
  const completeQuest = useMentraStore((state) => state.completeQuest);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const workingAgents = agents.filter(a => a.status === 'WORKING' || a.status === 'AWAITING_APPROVAL');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      {/* Hero / Boot Scene with 3D Core */}
      <section className="relative pt-6 pb-12 px-4 border-b border-slate-900 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4 backdrop-blur-md shadow-lg shadow-cyan-500/5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            SYSTEM INITIALIZING — MENTRA ONLINE
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent max-w-3xl leading-tight">
            YOUR PERSONAL AI OPERATING SYSTEM
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mt-3 font-sans leading-relaxed">
            Neural Command Center combining Autonomous AI Agents, Life RPG Progression, Second Brain Memory, and Unified Workflow Intelligence.
          </p>

          {/* 3D MENTRA Core Visualization */}
          <div className="w-full max-w-2xl my-2">
            <MentraCore3D className="h-[320px] sm:h-[380px]" />
          </div>

          {/* Persistent Command-First Bar */}
          <div className="w-full -mt-4">
            <CommandBar />
          </div>
        </div>
      </section>

      {/* Main Command Center Dashboard */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Urgent Attention / Action Gate Banner */}
        {workingAgents.some(a => a.status === 'AWAITING_APPROVAL') && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-amber-200 text-sm">Agent Approval Gate Triggered:</span>
                <p className="text-xs text-amber-300/80">Business Agent has drafted weekly executive report and awaits operator sign-off.</p>
              </div>
            </div>
            <Link
              href="/agents"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-medium transition whitespace-nowrap"
            >
              Review Actions →
            </Link>
          </div>
        )}

        {/* 3-Column Tactical Command HUD Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Daily Quests & Player RPG */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <Target className="w-4 h-4" /> Active Life Quests
                </div>
                <Link href="/quests" className="text-xs text-slate-400 hover:text-cyan-400 transition">
                  View All ({quests.length}) →
                </Link>
              </div>

              <div className="space-y-3">
                {activeQuests.slice(0, 3).map((quest) => (
                  <div
                    key={quest.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition group/card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover/card:text-cyan-300 transition">
                        {quest.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex-shrink-0">
                        +{quest.rewardXp} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5">
                      {quest.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        [{quest.type}] • {quest.category}
                      </span>
                      <button
                        onClick={() => completeQuest(quest.id)}
                        className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-500/40 text-slate-300 border border-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Stats Radar Snapshot */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm">
              <div className="text-violet-400 font-mono text-xs uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Neural Player Attributes
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(player.stats).map(([stat, val]) => (
                  <div key={stat} className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px]">{stat}</span>
                    <span className="text-cyan-400 font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Agent Fleet Operations */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-violet-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <Cpu className="w-4 h-4" /> Autonomous Agent Fleet
                </div>
                <Link href="/agents" className="text-xs text-slate-400 hover:text-violet-400 transition">
                  Manage Fleet →
                </Link>
              </div>

              <div className="space-y-3">
                {agents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200">{agent.name}</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                          agent.status === 'WORKING'
                            ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 animate-pulse'
                            : agent.status === 'AWAITING_APPROVAL'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{agent.currentTask}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Memory Vault Snapshot */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <Brain className="w-4 h-4" /> Neural Memory Vault
                </div>
                <Link href="/memory" className="text-xs text-slate-400 hover:text-blue-400 transition">
                  Search Vault →
                </Link>
              </div>
              <div className="space-y-2">
                {memories.slice(0, 2).map((mem) => (
                  <div key={mem.id} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
                    <span className="font-mono text-[10px] text-cyan-400 uppercase">[{mem.type}]</span>
                    <h5 className="font-medium text-slate-200 mt-0.5">{mem.title}</h5>
                    <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{mem.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Finance & Skill Matrix */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <DollarSign className="w-4 h-4" /> Financial Velocity HUD
                </div>
                <Link href="/finance" className="text-xs text-slate-400 hover:text-emerald-400 transition">
                  Full Ledger →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Monthly Income</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">₹{finance.monthlyIncome.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Monthly Expenses</span>
                  <div className="text-base font-bold text-rose-400 mt-1">₹{finance.monthlyExpenses.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed font-sans">
                <span className="font-mono font-semibold text-cyan-400 text-[10px] block mb-1">AI SENTINEL INSIGHT:</span>
                {finance.aiInsight}
              </div>
            </div>

            {/* Skill Matrix Progress */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/80 border border-slate-800/80 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <TrendingUp className="w-4 h-4" /> Skill Tree Matrix
                </div>
                <Link href="/skills" className="text-xs text-slate-400 hover:text-amber-400 transition">
                  Skill Map →
                </Link>
              </div>
              <div className="space-y-2.5">
                {skills.slice(0, 3).map((skill) => (
                  <div key={skill.id} className="text-xs">
                    <div className="flex justify-between font-mono mb-1">
                      <span className="text-slate-300 text-[11px]">{skill.name}</span>
                      <span className="text-cyan-400 font-bold">LV.0{skill.level}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.round((skill.currentXp / skill.nextLevelXp) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
