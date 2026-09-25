'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Sword, 
  Target, 
  DollarSign, 
  Brain, 
  Bot, 
  Flame, 
  Plus, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  Zap,
  Mic,
  BookOpen
} from 'lucide-react';
import CommandBar from '@/components/mentra/CommandBar';
import SystemStatus from '@/components/mentra/SystemStatus';
import QuestCard from '@/components/quests/QuestCard';
import FinanceCard from '@/components/finance/FinanceCard';
import SkillNode from '@/components/skills/SkillNode';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import MemoryCard from '@/components/mentra/MemoryCard';
import StatCard from '@/components/mentra/StatCard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-52 h-52 rounded-full bg-mentra-orange/20 blur-3xl animate-pulse" />
    </div>
  )
});

export default function HomePage() {
  const { user, profile, progress } = useAuth();
  const { quests, goals, skills, finance, agents, memories, player } = useMentraStore();

  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const workingAgents = agents.filter(a => a.status === 'WORKING' || a.status === 'READY' || a.status === 'MONITORING');

  // Contextual time-of-day intelligence
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isEvening = currentHour >= 18 || currentHour < 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-300">
      
      {/* 1. Asymmetrical Editorial Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 sm:pt-6">
        
        {/* Left Side: Editorial Typography & Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 glass-pill border-mentra-orange/30 bg-black/50 text-xs text-mentra-amber font-mono">
            <span className="w-2 h-2 rounded-full bg-mentra-orange animate-pulse shadow-[0_0_8px_#ff4a00]" />
            <span>MENTRA PERSONAL SYSTEM // V3.0 PRODUCTION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08]">
            Your life. <br />
            <span className="bg-gradient-to-r from-mentra-orange via-mentra-amber to-amber-200 bg-clip-text text-transparent">
              One intelligent system.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-xl font-sans leading-relaxed">
            Goals, capital velocity, adaptive skill learning, neural memory, and autonomous AI agents — connected around <span className="font-serif-accent text-white text-xl">your evolution</span>.
          </p>

          {/* Primary Action Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('command-center-bar');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs sm:text-sm tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(255,74,0,0.5)] hover:opacity-90 active:scale-98 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Ask MENTRA</span>
            </button>

            <Link
              href="/skills/skill_public_speaking/coach"
              className="px-6 py-3.5 rounded-full glass-pill bg-white/5 hover:bg-white/10 border-white/15 text-white font-medium text-xs sm:text-sm tracking-wide flex items-center gap-2 transition-all"
            >
              <Mic className="w-4 h-4 text-mentra-orange" />
              <span>Public Speaking Coach</span>
              <ArrowRight className="w-4 h-4 text-mentra-amber" />
            </Link>
          </div>

          {/* Player Quick Stats Ribbon */}
          <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-white/40 uppercase">RANK & LEVEL</div>
              <div className="text-sm sm:text-base font-mono font-bold text-white mt-0.5">LEVEL 0{displayLevel}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-white/40 uppercase">ACTIVE STREAK</div>
              <div className="text-sm sm:text-base font-mono font-bold text-mentra-amber mt-0.5">{displayStreak} Days 🔥</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-white/40 uppercase">AI FLEET</div>
              <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-0.5">{workingAgents.length} Online</div>
            </div>
          </div>
        </div>

        {/* Right Side: 3D MENTRA Core Intelligence Visual */}
        <div className="lg:col-span-5 h-[360px] sm:h-[420px] relative flex items-center justify-center">
          <div className="w-full h-full relative">
            <MentraCore3D className="w-full h-full" />
          </div>
        </div>

      </section>

      {/* Contextual Intelligence Notification Banner */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-mentra-orange/15 via-black/60 to-black/60 border border-mentra-orange/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-mentra-orange/20 text-mentra-amber">
            {isEvening ? <BookOpen className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-mentra-amber">
              {isMorning ? '🌅 MORNING FOCUS PROTOCOL' : isEvening ? '🌙 EVENING REFLECTION WINDOW' : '⚡ MIDDAY EXECUTION VELOCITY'}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-sans">
              {isMorning 
                ? `Operator ${displayName}, you have ${activeQuests.length} missions scheduled today. Maintain steady focus cadence.` 
                : isEvening 
                ? 'Time to lock in today\'s lessons and convert key decisions into neural memory.'
                : 'Active skill trajectory ready: Practice your 60-second speech baseline (+45 XP).'}
            </div>
          </div>
        </div>

        <Link
          href={isEvening ? '/journal' : '/skills/skill_public_speaking/coach'}
          className="px-4 py-2 rounded-full bg-mentra-orange text-white text-xs font-mono font-semibold self-start sm:self-auto hover:opacity-90 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <span>{isEvening ? 'WRITE JOURNAL' : 'START PRACTICE'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* 2. System Status & Natural Language Command Hub */}
      <section id="command-center-bar" className="space-y-4 pt-4">
        <SystemStatus />
        <CommandBar />
      </section>

      {/* 3. Floating Glass Intelligence Cards Matrix */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-mentra-orange" />
            <h2 className="text-lg font-bold font-display uppercase tracking-wider text-white">
              INTELLIGENCE MATRIX
            </h2>
          </div>
          <span className="text-xs font-mono text-white/40">REAL-TIME TELEMETRY HUD</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Player Level"
            value={`0${displayLevel}`}
            subtitle={`XP: ${displayXp} / 1000 (${Math.round((displayXp / 1000) * 100)}%)`}
            icon={Sparkles}
            highlight={true}
          />
          <StatCard
            title="Active Quests"
            value={activeQuests.length}
            subtitle={`${quests.filter(q => q.status === 'COMPLETED').length} missions completed`}
            icon={Sword}
          />
          <StatCard
            title="Capital Velocity"
            value={`₹${finance.monthlyIncome.toLocaleString()}`}
            subtitle={`Savings: ₹${finance.monthlySavings.toLocaleString()}`}
            icon={DollarSign}
            trend="+14%"
          />
          <StatCard
            title="Autonomous Agents"
            value={`${workingAgents.length} / ${agents.length}`}
            subtitle="All agent permissions active"
            icon={Bot}
          />
        </div>
      </section>

      {/* 4. Adaptive Skill Coach & Daily Missions Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Daily Quests */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-mentra-orange" />
              <h3 className="text-base font-bold font-display text-white">
                TODAY&apos;S MISSIONS ({activeQuests.length})
              </h3>
            </div>
            <Link 
              href="/quests"
              className="text-xs font-mono text-mentra-amber hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>QUEST MATRIX</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeQuests.length === 0 ? (
            <div className="p-8 glass-panel text-center rounded-2xl border-white/10 space-y-3">
              <div className="text-xs font-mono text-mentra-amber uppercase tracking-widest">
                NO ACTIVE QUESTS
              </div>
              <p className="text-sm text-white/60">
                Your campaign hasn&apos;t started yet. Initialize your first daily or main mission.
              </p>
              <Link
                href="/quests"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold shadow-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Mission</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeQuests.slice(0, 3).map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Adaptive Skill Learning Feature Widget */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-mentra-orange" />
              <h3 className="text-base font-bold font-display text-white">
                ADAPTIVE LEARNING COACH
              </h3>
            </div>
            <Link 
              href="/skills"
              className="text-xs font-mono text-mentra-amber hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>SKILL MATRIX</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-mentra-amber uppercase">
                <Mic className="w-4 h-4 text-mentra-orange" />
                <span>PUBLIC SPEAKING &amp; RHETORIC</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mentra-orange/20 text-mentra-amber">
                LEVEL 01
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white font-display">
                Lesson 1.1: 60-Second Baseline Diagnostic
              </h4>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                Capture your baseline speaking telemetry, pacing, and filler word frequency.
              </p>
            </div>

            <Link
              href="/skills/skill_public_speaking/coach"
              className="w-full py-3 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,74,0,0.3)] hover:opacity-90 transition-all"
            >
              <span>ENTER COACH &amp; RECORD RUN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </section>

      {/* 5. Autonomous Fleet & Neural Memory Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Autonomous Agents Status */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-mentra-orange" />
              <h3 className="text-base font-bold font-display text-white">
                AUTONOMOUS AGENT FLEET
              </h3>
            </div>
            <Link 
              href="/agents"
              className="text-xs font-mono text-mentra-amber hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>FLEET COMMAND</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {agents.slice(0, 2).map(agent => (
              <AgentStatusCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Right: Neural Memory Vault */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-mentra-amber" />
              <h3 className="text-base font-bold font-display text-white">
                NEURAL MEMORY VAULT
              </h3>
            </div>
            <Link 
              href="/memory"
              className="text-xs font-mono text-mentra-amber hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>MEMORY VAULT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {memories.slice(0, 2).map(mem => (
              <MemoryCard key={mem.id} memory={mem} />
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
