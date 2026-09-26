'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowDown, ArrowRight, Bot, Brain, DollarSign, Sparkles, Sword, Target, Zap } from 'lucide-react';
import CommandBar from '@/components/mentra/CommandBar';
import SystemStatus from '@/components/mentra/SystemStatus';
import QuestCard from '@/components/quests/QuestCard';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import MemoryCard from '@/components/mentra/MemoryCard';
import StatCard from '@/components/mentra/StatCard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
    </div>
  )
});

export default function HomePage() {
  const { user, profile, progress } = useAuth();
  const { quests, goals, finance, agents, memories, player } = useMentraStore();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.2 });

  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator';

  const activeQuests = quests.filter(quest => quest.status === 'ACTIVE');
  const completedQuests = quests.filter(quest => quest.status === 'COMPLETED').length;
  const workingAgents = agents.filter(agent => ['WORKING', 'READY', 'MONITORING'].includes(agent.status));

  return (
    <div className="story-shell story-snap -mt-20 lg:-mt-28">
      <div className="pointer-events-none fixed right-5 top-1/2 z-40 hidden h-36 w-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-white/10 lg:block">
        <motion.div
          className="h-full w-full origin-top bg-gradient-to-b from-indigo-400 to-cyan-300"
          style={{ scaleY: progressScale }}
        />
      </div>

      <section className="story-section pt-28 lg:pt-36">
        <div className="story-glow left-[-6rem] top-[12%] h-80 w-80 bg-indigo-500/20" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="story-kicker">MENTRA / Personal operating system</div>
            <h1 className="story-title mt-6 max-w-5xl text-[clamp(4rem,9vw,8.5rem)] font-extrabold">
              Move with
              <span className="story-accent block">one clear thread.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/56">
              Welcome back, {displayName}. Your missions, money, memory and agents now live in one connected execution layer.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('command-layer')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Ask MENTRA <Zap className="h-4 w-4" />
              </button>
              <Link
                href="/goals"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.07]"
              >
                Open goals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Level', `0${displayLevel}`],
                ['Streak', `${displayStreak}d`],
                ['Agents', `${workingAgents.length}/${agents.length || 0}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/9 bg-white/[0.025] p-4">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/32">{label}</div>
                  <div className="mt-2 text-xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[420px] lg:col-span-5 lg:h-[620px]">
            <MentraCore3D className="h-full w-full" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-mono tracking-[0.18em] text-cyan-200 backdrop-blur-xl">
              CORE ONLINE // LVL {displayLevel}
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/25 lg:flex">
          Scroll <ArrowDown className="h-3 w-3" />
        </div>
      </section>

      <section id="command-layer" className="story-section">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <div className="story-kicker">01 / Command layer</div>
            <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
              Say the goal.
              <span className="story-accent block">MENTRA routes the work.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
              One natural-language entry point across your system. Context stays attached while the right agent or workflow takes over.
            </p>
          </div>
          <div className="space-y-4 lg:col-span-8">
            <SystemStatus />
            <CommandBar />
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="story-kicker">02 / Live system</div>
              <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
                Everything important,
                <span className="story-accent block">in one field of view.</span>
              </h2>
            </div>
            <div className="story-number hidden lg:block">02</div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Player Level"
              value={`0${displayLevel}`}
              subtitle={`XP: ${displayXp} / 1000`}
              icon={Sparkles}
              highlight
            />
            <StatCard
              title="Active Quests"
              value={activeQuests.length}
              subtitle={`${completedQuests} completed`}
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
              subtitle="Permission-aware execution"
              icon={Bot}
            />
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="story-kicker">03 / Daily execution</div>
            <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
              Turn intent
              <span className="story-accent block">into movement.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
              Your active missions stay visible while goals and learning continue in the background.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/quests" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Open quests
              </Link>
              <Link href="/goals" className="rounded-full border border-white/12 px-5 py-3 text-sm text-white/65">
                Goals
              </Link>
            </div>
          </div>
          <div className="space-y-3 lg:col-span-7">
            {activeQuests.length > 0 ? (
              activeQuests.slice(0, 3).map(quest => <QuestCard key={quest.id} quest={quest} />)
            ) : (
              <div className="story-card p-8">
                <Target className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-5 text-2xl font-semibold">No active missions yet.</h3>
                <p className="mt-3 text-sm text-white/45">Create one clear next move and let MENTRA keep the thread alive.</p>
                <Link href="/quests" className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-200">
                  Create mission <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
              <div className="story-kicker">04 / Intelligence network</div>
              <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
                Agents act.
                <span className="story-accent block">Memory connects.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
                Specialists handle narrow jobs; memory keeps their work aligned with your longer story.
              </p>
            </div>

            <div className="space-y-4 lg:col-span-7">
              <div className="story-card p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-200" />
                    <span className="text-xs uppercase tracking-[0.2em] text-white/55">Agent fleet</span>
                  </div>
                  <Link href="/agents" className="text-xs text-indigo-200">Open fleet</Link>
                </div>
                <div className="space-y-3">
                  {agents.slice(0, 2).map(agent => <AgentStatusCard key={agent.id} agent={agent} />)}
                </div>
              </div>

              <div className="story-card p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-cyan-200" />
                    <span className="text-xs uppercase tracking-[0.2em] text-white/55">Memory vault</span>
                  </div>
                  <Link href="/memory" className="text-xs text-indigo-200">Open memory</Link>
                </div>
                <div className="space-y-3">
                  {memories.slice(0, 2).map(memory => <MemoryCard key={memory.id} memory={memory} />)}
                  {memories.length === 0 && (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-sm text-white/42">
                      MENTRA will build this layer as you make decisions and save context.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section min-h-[75svh]">
        <div className="mx-auto w-full max-w-7xl text-center">
          <div className="story-kicker">05 / Next move</div>
          <h2 className="story-title mx-auto mt-5 max-w-4xl text-5xl font-bold sm:text-7xl lg:text-8xl">
            Less dashboard.
            <span className="story-accent block">More direction.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/50">
            MENTRA is designed to keep your next decision obvious without losing the context behind it.
          </p>
          <button
            onClick={() => document.getElementById('command-layer')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-indigo-400"
          >
            Ask MENTRA <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
