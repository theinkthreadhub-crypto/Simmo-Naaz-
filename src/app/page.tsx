'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SystemStatus from '@/components/mentra/SystemStatus';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import QuestCard from '@/components/quests/QuestCard';
import FinanceCard from '@/components/finance/FinanceCard';
import SkillNode from '@/components/skills/SkillNode';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import MemoryCard from '@/components/mentra/MemoryCard';
import StatCard from '@/components/mentra/StatCard';
import { formatCurrency } from '@/lib/utils';
import {
  Terminal,
  Activity,
  Target,
  Cpu,
  DollarSign,
  TrendingUp,
  Brain,
  FileText,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Compass,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full flex items-center justify-center">
      <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
    </div>
  )
});

export default function HomePage() {
  const [bootStep, setBootStep] = useState<'INIT' | 'ONLINE' | 'ENTERED'>('ENTERED');

  const player = useMentraStore((state) => state.player);
  const quests = useMentraStore((state) => state.quests);
  const finance = useMentraStore((state) => state.finance);
  const skills = useMentraStore((state) => state.skills);
  const memories = useMentraStore((state) => state.memories);
  const agents = useMentraStore((state) => state.agents);
  const completeQuest = useMentraStore((state) => state.completeQuest);
  const approveAgentTask = useMentraStore((state) => state.approveAgentTask);
  const updateAgentStatus = useMentraStore((state) => state.updateAgentStatus);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="flex-1 w-full overflow-x-hidden">
          {/* =========================================================================
              SCENE 1: SYSTEM BOOT & 3D MENTRA CORE ENTRY
              ========================================================================= */}
          <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-12 border-b border-white/10 overflow-hidden bg-gradient-to-b from-[#0d1017] via-[#07090e] to-[#07090e]">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-[350px] h-[250px] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none" />

            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-4 backdrop-blur-md shadow-lg shadow-cyan-500/10 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              SYSTEM ONLINE • MENTRA KERNEL READY
            </div>

            {/* Display Typography */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent max-w-4xl leading-tight font-display">
              YOUR PERSONAL AI OPERATING SYSTEM
            </h1>

            <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mt-4 font-sans leading-relaxed">
              Unified command center combining Autonomous AI Agents, Real-Life RPG Character Progression, Second Brain Neural Memory, and Executive Operating Intelligence.
            </p>

            {/* 3D Core Orb Component */}
            <div className="w-full max-w-3xl my-4">
              <MentraCore3D className="h-[340px] sm:h-[400px]" />
            </div>

            {/* Persistent Command-First Bar */}
            <div className="w-full max-w-3xl -mt-4 mb-6">
              <CommandBar />
            </div>

            {/* Scroll Indicator */}
            <a
              href="#player-system"
              className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition"
            >
              <span>EXPLORE MENTRA STORYLINE</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16">
            {/* System Status Banner */}
            <SystemStatus
              level={player.level}
              xp={player.currentXp}
              nextLevelXp={player.nextLevelXp}
              streakDays={player.streakDays}
            />

            {/* =====================================================================
                SCENE 2: PLAYER SYSTEM (Level, XP, Streak, Main Goal)
                ===================================================================== */}
            <section id="player-system" className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    SCENE 02 • SOVEREIGN PLAYER TELEMETRY
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Character State & Attributes</h2>
                </div>
                <Link href="/quests" className="text-xs font-mono text-cyan-400 hover:underline">
                  Full Quest Log →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="CURRENT LEVEL" value={`LV.${player.level < 10 ? `0${player.level}` : player.level}`} badge={player.rank} color="cyan" subtext="Vanguard Architect" />
                <StatCard label="REPUTATION XP" value={`${player.currentXp} XP`} badge={`${Math.round((player.currentXp/player.nextLevelXp)*100)}%`} color="violet" subtext={`Next: ${player.nextLevelXp} XP`} />
                <StatCard label="ACTIVE STREAK" value={`${player.streakDays} DAYS`} badge="UNBROKEN" color="amber" subtext="Sovereignty Multiplier" />
                <StatCard label="MISSIONS COMPLETED" value={player.totalQuestsCompleted} badge="LIFETIME" color="emerald" subtext="Real-world actions verified" />
              </div>

              {/* Attributes Quad */}
              <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> Player Attribute Matrix
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-xs">
                  {Object.entries(player.stats).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 uppercase">{k}</span>
                      <span className="text-lg font-bold text-cyan-400 mt-1">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* =====================================================================
                SCENE 3: DAILY QUESTS & LIFE RPG BOARD
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    SCENE 03 • LIFE RPG PROTOCOLS
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Daily Quests & Story Missions</h2>
                </div>
                <Link href="/quests" className="text-xs font-mono text-cyan-400 hover:underline">
                  View All Quests ({quests.length}) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {activeQuests.slice(0, 3).map((quest) => (
                  <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
                ))}
              </div>
            </section>

            {/* =====================================================================
                SCENE 4: AI AGENT FLEET OPERATIONS
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block">
                    SCENE 04 • AUTONOMOUS FLEET
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Specialized AI Agents & Approval Gates</h2>
                </div>
                <Link href="/agents" className="text-xs font-mono text-violet-400 hover:underline">
                  Manage Fleet (8) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {agents.slice(0, 4).map((agent) => (
                  <AgentStatusCard
                    key={agent.id}
                    agent={agent}
                    onApprove={approveAgentTask}
                    onPing={(id) => updateAgentStatus(id, 'WORKING', 'Scouting real-time market data...')}
                  />
                ))}
              </div>
            </section>

            {/* =====================================================================
                SCENE 5: FINANCIAL VELOCITY HUD
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                    SCENE 05 • FINANCIAL VELOCITY
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Cash Velocity & Unit Economics</h2>
                </div>
                <Link href="/finance" className="text-xs font-mono text-emerald-400 hover:underline">
                  Full Ledger →
                </Link>
              </div>

              <FinanceCard finance={finance} />
            </section>

            {/* =====================================================================
                SCENE 6: INTERACTIVE SKILL TREE MATRIX
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                    SCENE 06 • NEURAL MASTERY
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Interactive Skill Tree Matrix</h2>
                </div>
                <Link href="/skills" className="text-xs font-mono text-amber-400 hover:underline">
                  Skill Map →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {skills.slice(0, 3).map((skill) => (
                  <SkillNode key={skill.id} skill={skill} />
                ))}
              </div>
            </section>

            {/* =====================================================================
                SCENE 7: MEMORY VAULT & SECOND BRAIN
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    SCENE 07 • SECOND BRAIN
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">Neural Memory Vault</h2>
                </div>
                <Link href="/memory" className="text-xs font-mono text-cyan-400 hover:underline">
                  Search Vault →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {memories.map((mem) => (
                  <MemoryCard key={mem.id} memory={mem} />
                ))}
              </div>
            </section>

            {/* =====================================================================
                SCENE 8: SYSTEM REPORT & WEEKLY DOSSIER
                ===================================================================== */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block">
                    SCENE 08 • OPERATIONAL AUDIT
                  </span>
                  <h2 className="text-2xl font-bold text-white font-display">System Executive Report</h2>
                </div>
                <Link href="/reports" className="text-xs font-mono text-violet-400 hover:underline">
                  View Full Dossier →
                </Link>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1017]/90 border border-cyan-500/40 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    WEEKLY HARVEST: +870 XP • 4/5 MISSIONS COMPLETED
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Sovereign Run-Rate on Track: {formatCurrency(finance.monthlyIncome)}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Meta Ads unit economics optimized at 4.2x ROAS. Multi-agent pipeline ready for operator expansion.
                  </p>
                </div>

                <Link
                  href="/reports"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-500/20 transition whitespace-nowrap self-start md:self-auto"
                >
                  Inspect Weekly Briefing →
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
