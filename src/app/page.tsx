'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { formatCurrency } from '@/lib/utils';
import {
  Globe,
  ArrowRight,
  Shield,
  Zap,
  Target,
  DollarSign,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Brain,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

const stats = [
  { value: '150+', label: 'Missions delivered' },
  { value: '98%', label: 'Agent precision' },
];

const bars = [34, 52, 44, 70, 88];

/* Partner wordmarks — mark + text */
const partners = [
  {
    name: 'Research Agent',
    mark: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="w-4 h-4">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6v4l3 3" />
      </svg>
    ),
  },
  {
    name: 'Gmail Sentinel',
    mark: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4 text-[#ff8a1f]">
        <path d="M2 4h16v12H2z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 5l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    name: 'Finance Agent',
    mark: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="w-4 h-4">
        <path d="M10 2.5 17 10l-7 7.5L3 10l7-7.5Z" />
      </svg>
    ),
  },
  {
    name: 'Learning Engine',
    mark: (
      <svg viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
        <path d="M2 16V6l4.5 6L11 6l4.5 6L20 6v10" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp Gateway',
    mark: (
      <svg viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 text-emerald-400">
        <path d="M2 5l3.5 11L9 8l3.5 8L16 5" />
        <circle cx="19" cy="7" r="1.6" />
      </svg>
    ),
  },
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const player = useMentraStore((state) => state.player);
  const quests = useMentraStore((state) => state.quests);
  const finance = useMentraStore((state) => state.finance);
  const skills = useMentraStore((state) => state.skills);
  const memories = useMentraStore((state) => state.memories);
  const agents = useMentraStore((state) => state.agents);
  const completeQuest = useMentraStore((state) => state.completeQuest);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const workingAgents = agents.filter(a => a.status === 'WORKING' || a.status === 'AWAITING_APPROVAL');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = video.play();
    if (play?.catch) play.catch(() => {});

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      setReady(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col selection:bg-[#ff3d00] selection:text-white">
      <HUDOverlay />

      {/* =========================================================================
          HERO SECTION (Fluxora Exact Ember Palette + Video + Asymmetric Scrim)
          ========================================================================= */}
      <section className="relative isolation flex flex-col justify-between min-h-[92svh] overflow-hidden pt-28 pb-10 px-[var(--gutter)] bg-gradient-to-br from-[#2a0b02] via-[#1a0701] to-[#120400]">
        {/* Looping AR Visor Background Video */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover object-[68%_center] transition-all duration-1000 ${
              ready ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            src="/hero-loop.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onCanPlay={() => setReady(true)}
          />

          {/* Asymmetric Scrim Overlays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(96deg, rgba(10, 3, 0, 0.92) 0%, rgba(14, 4, 0, 0.72) 32%, rgba(20, 6, 0, 0.18) 52%, rgba(20, 6, 0, 0) 68%),
                linear-gradient(0deg, rgba(9, 2, 0, 0.82) 0%, rgba(9, 2, 0, 0.15) 28%, rgba(0, 0, 0, 0) 46%),
                linear-gradient(180deg, rgba(8, 2, 0, 0.55) 0%, rgba(0, 0, 0, 0) 22%)
              `,
            }}
          />

          {/* Vertical Hairline Rules */}
          <div className="absolute inset-0 flex justify-between px-[30%] pointer-events-none opacity-40">
            <span className="w-px bg-white/10" />
            <span className="w-px bg-white/10 ml-3.5" />
            <span className="w-px bg-white/10" />
          </div>
        </div>

        {/* Hero Center Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] items-center gap-10 max-w-7xl mx-auto w-full z-10 my-auto">
          {/* Left Column: Lead Content */}
          <div className="max-w-[640px] space-y-6">
            {/* Fine Print Note */}
            <p className="inline-flex items-center gap-2.5 pt-3 border-t border-white/10 text-white/50 text-xs font-mono tracking-wide">
              <Globe className="w-5 h-5 text-[#ff8a1f] flex-shrink-0" />
              <span>MENTRA OS • Autonomous AI Command Center & Life RPG</span>
            </p>

            {/* Display Headline with Instrument Serif Accent */}
            <h1 className="font-['Inter_Tight'] text-[clamp(2.7rem,6.2vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.035em] text-white drop-shadow-2xl">
              Technology<br />
              Crafted for All<br />
              Not <em className="font-['Instrument_Serif'] font-normal italic text-[#ff8a1f] tracking-normal">Machines</em>
            </h1>

            {/* Subtitle */}
            <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-[420px]">
              We create clear, intuitive, and autonomous personal operating systems shaped by real human ambition and character mastery.
            </p>

            {/* CTA + Proof Badge Row */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Link className="btn btn--flame text-base" href="/quests">
                Get started
                <span className="grid place-items-center w-10 h-10 rounded-full bg-white text-[#1a0600]" aria-hidden="true">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Four Tinted Avatar Dots & Proof Copy */}
              <div className="flex items-center gap-3">
                <div className="flex" aria-hidden="true">
                  <i className="w-7 h-7 rounded-full border-2 border-[#160700]/90 bg-gradient-to-br from-[#ff7a3d] to-[#ffb27a]" />
                  <i className="w-7 h-7 -ml-2.5 rounded-full border-2 border-[#160700]/90 bg-gradient-to-br from-[#6f4bd8] to-[#a98cff]" />
                  <i className="w-7 h-7 -ml-2.5 rounded-full border-2 border-[#160700]/90 bg-gradient-to-br from-[#1f9ea8] to-[#63d6df]" />
                  <i className="w-7 h-7 -ml-2.5 rounded-full border-2 border-[#160700]/90 bg-gradient-to-br from-[#d8434b] to-[#ff8a8f]" />
                </div>
                <div className="grid text-[10px] font-mono leading-tight text-white/50">
                  <strong className="text-xs font-semibold text-white/90">650+ Missions Logged</strong>
                  Live Autonomous Agents
                </div>
              </div>
            </div>

            {/* Glass Stat Cards */}
            <ul className="flex flex-wrap gap-4 pt-4 m-0 p-0 list-none">
              {stats.map((stat, idx) => (
                <li
                  key={stat.label}
                  className={`relative grid content-between w-48 min-h-[128px] p-4.5 rounded-2xl border border-white/15 backdrop-blur-xl shadow-2xl ${
                    idx === 1
                      ? 'bg-gradient-to-br from-[rgba(120,30,4,0.5)] to-[rgba(48,14,2,0.5)]'
                      : 'bg-[rgba(56,20,6,0.42)]'
                  }`}
                >
                  <span className="absolute top-3.5 right-4 text-xs text-white/40 font-mono" aria-hidden="true">*</span>
                  <span className="font-['Inter_Tight'] text-[clamp(1.7rem,2.4vw,2.3rem)] font-semibold leading-none tracking-tight text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs text-white/50 font-mono">{stat.label}</span>
                  <span className="absolute right-4 bottom-5 w-3.5 h-px bg-white/30" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Ghost Analytics Panel (Visible on Desktop) */}
          <aside className="hidden lg:block justify-self-end max-w-[330px] text-white/30 p-6 rounded-3xl bg-[rgba(30,10,3,0.35)] border border-white/10 backdrop-blur-md">
            <div className="flex items-end gap-4.5">
              <div className="flex items-end gap-1.5 h-[74px]">
                {bars.map((h, i) => (
                  <span
                    key={i}
                    className="w-2.5 rounded-t bg-gradient-to-t from-[#ff3d00]/70 to-[#ff8a1f]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-[11px] leading-tight font-mono text-white/50">
                <strong className="block font-['Inter_Tight'] text-2xl font-bold tracking-tight text-[#ff8a1f]">
                  +42%
                </strong>
                Experience<br />Performance
              </p>
            </div>
            <h2 className="mt-7 font-['Inter_Tight'] text-xl font-medium text-white/70 tracking-tight">
              Measure Real Impact
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              We track operator velocity through meaningful metrics and refine every agent loop until daily execution feels effortless.
            </p>
          </aside>
        </div>

        {/* Footer Band: Watermark & Partner/Agent Strip */}
        <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mt-8 max-w-7xl mx-auto w-full border-t border-white/10 pt-6">
          <span className="font-['Inter_Tight'] text-5xl sm:text-7xl font-bold leading-none tracking-tighter text-white/[0.06] select-none" aria-hidden="true">
            MENTRA
          </span>

          <div className="text-left md:text-right">
            <span className="block mb-2 text-xs font-mono text-white/40 uppercase tracking-widest">
              Autonomous Integrations & Agents
            </span>
            <ul className="flex flex-wrap items-center gap-4 sm:gap-6 m-0 p-0 list-none">
              {partners.map((partner) => (
                <li key={partner.name} className="inline-flex items-center gap-2 text-sm text-white/80 font-medium">
                  {partner.mark}
                  <span>{partner.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PERSISTENT COMMAND BAR SECTION
          ========================================================================= */}
      <section className="py-6 bg-[#120400] relative z-20 border-b border-white/10">
        <CommandBar />
      </section>

      {/* =========================================================================
          MAIN COMMAND CENTER & LIFE RPG DASHBOARD (Fluxora Glass Grid)
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full space-y-8">
        {/* Human-in-the-loop Approval Banner */}
        {workingAgents.some(a => a.status === 'AWAITING_APPROVAL') && (
          <div className="p-4 rounded-2xl bg-[#341004]/70 border border-[#ff8a1f]/60 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff8a1f] flex-shrink-0" />
              <div>
                <span className="font-semibold text-amber-100 text-sm">Agent Gate Triggered:</span>
                <p className="text-xs text-amber-200/80">Business Agent prepared weekly operations dossier. Ready for operator approval.</p>
              </div>
            </div>
            <Link
              href="/agents"
              className="btn btn--flame !py-1.5 !px-4 text-xs"
            >
              Review Actions →
            </Link>
          </div>
        )}

        {/* 3-Column Tactical Command HUD Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Daily Quests & Player RPG */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-[#ff8a1f]/50 transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-wider font-semibold">
                  <Target className="w-4 h-4" /> Active Life Quests
                </div>
                <Link href="/quests" className="text-xs text-white/50 hover:text-[#ff8a1f] transition">
                  View All ({quests.length}) →
                </Link>
              </div>

              <div className="space-y-3">
                {activeQuests.slice(0, 3).map((quest) => (
                  <div
                    key={quest.id}
                    className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#ff8a1f]/40 transition group/card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover/card:text-[#ff8a1f] transition">
                        {quest.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff3d00]/20 text-[#ff8a1f] border border-[#ff3d00]/30 flex-shrink-0">
                        +{quest.rewardXp} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 line-clamp-2 mb-3">
                      {quest.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/40 uppercase">
                        [{quest.type}] • {quest.category}
                      </span>
                      <button
                        onClick={() => completeQuest(quest.id)}
                        className="flex items-center gap-1 text-[11px] font-mono px-3 py-1 rounded-full bg-white/10 hover:bg-[#ff3d00]/30 hover:text-[#ff8a1f] text-white/80 border border-white/10 transition"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Attributes Snapshot */}
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Neural Player Attributes
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                {Object.entries(player.stats).map(([stat, val]) => (
                  <div key={stat} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <span className="text-white/50 uppercase text-[10px]">{stat}</span>
                    <span className="text-[#ff8a1f] font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Agent Fleet Operations */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-wider font-semibold">
                  <Cpu className="w-4 h-4" /> Autonomous Agent Fleet
                </div>
                <Link href="/agents" className="text-xs text-white/50 hover:text-[#ff8a1f] transition">
                  Manage Fleet →
                </Link>
              </div>

              <div className="space-y-3">
                {agents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#ff8a1f]/40 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-100">{agent.name}</span>
                      <span
                        className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border ${
                          agent.status === 'WORKING'
                            ? 'bg-[#ff3d00]/20 text-[#ff8a1f] border-[#ff3d00]/40 animate-pulse'
                            : agent.status === 'AWAITING_APPROVAL'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-white/50 border-white/10'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-1">{agent.currentTask}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Vault Snapshot */}
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  <Brain className="w-4 h-4" /> Neural Memory Vault
                </div>
                <Link href="/memory" className="text-xs text-white/50 hover:text-amber-300 transition">
                  Search Vault →
                </Link>
              </div>
              <div className="space-y-2.5">
                {memories.slice(0, 2).map((mem) => (
                  <div key={mem.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                    <span className="font-mono text-[10px] text-[#ff8a1f] uppercase">[{mem.type}]</span>
                    <h5 className="font-medium text-slate-100 mt-0.5">{mem.title}</h5>
                    <p className="text-white/50 text-[11px] line-clamp-1 mt-0.5">{mem.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Finance & Skill Matrix */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <DollarSign className="w-4 h-4" /> Financial Velocity HUD
                </div>
                <Link href="/finance" className="text-xs text-white/50 hover:text-emerald-400 transition">
                  Full Ledger →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] font-mono text-white/50 uppercase">Monthly Income</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">{formatCurrency(finance.monthlyIncome)}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] font-mono text-white/50 uppercase">Monthly Expenses</span>
                  <div className="text-base font-bold text-rose-400 mt-1">{formatCurrency(finance.monthlyExpenses)}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#ff3d00]/10 border border-[#ff3d00]/30 text-xs text-amber-100 leading-relaxed font-sans">
                <span className="font-mono font-semibold text-[#ff8a1f] text-[10px] block mb-1">AI SENTINEL INSIGHT:</span>
                {finance.aiInsight}
              </div>
            </div>

            {/* Skill Matrix Progress */}
            <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-wider font-semibold">
                  <TrendingUp className="w-4 h-4" /> Skill Tree Matrix
                </div>
                <Link href="/skills" className="text-xs text-white/50 hover:text-[#ff8a1f] transition">
                  Skill Map →
                </Link>
              </div>
              <div className="space-y-3">
                {skills.slice(0, 3).map((skill) => (
                  <div key={skill.id} className="text-xs">
                    <div className="flex justify-between font-mono mb-1">
                      <span className="text-white/80 text-[11px]">{skill.name}</span>
                      <span className="text-[#ff8a1f] font-bold">LV.0{skill.level}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a1f] rounded-full"
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
