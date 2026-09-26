'use client';

import Link from 'next/link';
import { ArrowDown, ArrowLeft, Bot, Brain, DollarSign, Flame, ShieldCheck, Sparkles, Target } from 'lucide-react';

const metrics = [
  { label: 'Level', value: '07', detail: '680 / 1000 XP', icon: Sparkles },
  { label: 'Streak', value: '12 days', detail: 'Momentum active', icon: Flame },
  { label: 'Active goals', value: '4', detail: '2 high priority', icon: Target },
  { label: 'AI agents', value: '8', detail: 'Read-only preview', icon: Bot }
];

export default function DemoPage() {
  return (
    <main className="story-shell story-snap min-h-screen bg-[#070a12] text-white">
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#070a12]/70 px-4 py-2.5 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-bold tracking-[0.18em]">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            MENTRA
          </Link>
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950">
            Create / Sign in
          </Link>
        </div>
      </header>

      <section className="story-section">
        <div className="story-glow left-[-7rem] top-[18%] h-80 w-80 bg-indigo-500/22" />
        <div className="mx-auto w-full max-w-7xl">
          <div className="story-kicker">Read-only experience</div>
          <h1 className="story-title mt-6 max-w-5xl text-[clamp(4rem,10vw,9rem)] font-extrabold">
            See the system
            <span className="story-accent block">before it knows you.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/52">
            This demo uses sample data only. It shows how MENTRA can organize a personal operating system without creating an account or executing real actions.
          </p>
          <a href="#signal" className="mt-9 inline-flex items-center gap-2 text-sm text-cyan-200">
            Explore demo <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section id="signal" className="story-section">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="story-kicker">01 / Signal</div>
              <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
                Progress
                <span className="story-accent block">at a glance.</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {metrics.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className="story-card min-h-[220px] p-6">
                  <Icon className="h-5 w-5 text-cyan-200" />
                  <div className="mt-10 text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</div>
                  <div className="mt-2 text-3xl font-semibold">{value}</div>
                  <div className="mt-2 text-xs text-white/42">{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
          <div className="story-card p-8 sm:p-10">
            <div className="flex items-center gap-2 text-cyan-200">
              <Brain className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.2em]">Second brain</span>
            </div>
            <h2 className="mt-12 text-3xl font-semibold sm:text-4xl">Memory that stays attached to decisions.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/48">
              Sample memories, goals, projects and habits show how context can stay reusable instead of getting buried.
            </p>
          </div>

          <div className="story-card p-8 sm:p-10">
            <div className="flex items-center gap-2 text-cyan-200">
              <DollarSign className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.2em]">Finance layer</span>
            </div>
            <h2 className="mt-12 text-3xl font-semibold sm:text-4xl">₹84,500 monthly income.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/48">
              Demo-only numbers illustrate how income, savings and decisions can sit beside the rest of your operating context.
            </p>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="story-kicker">02 / Agent network</div>
              <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
                Specialists,
                <span className="story-accent block">one direction.</span>
              </h2>
            </div>
            <ShieldCheck className="hidden h-8 w-8 text-cyan-200 sm:block" />
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Research', 'Business', 'Finance', 'Memory', 'Calendar', 'Gmail', 'Drive', 'Learning'].map((name, index) => (
              <div key={name} className="story-card p-5">
                <div className="flex items-center justify-between">
                  <Bot className="h-4 w-4 text-indigo-300" />
                  <span className="text-[9px] font-mono text-white/25">0{index + 1}</span>
                </div>
                <div className="mt-9 text-lg font-semibold">{name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/30">Demo preview</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section min-h-[75svh]">
        <div className="mx-auto w-full max-w-5xl text-center">
          <div className="story-kicker">03 / Make it yours</div>
          <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl lg:text-8xl">
            The demo is static.
            <span className="story-accent block">Your MENTRA adapts.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/50">
            A real account unlocks private memory, live data, goals, missions and permission-aware agent actions.
          </p>
          <Link href="/" className="mt-9 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            Create / Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
