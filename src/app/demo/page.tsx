'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, Brain, DollarSign, Flame, ShieldCheck, Sparkles, Target } from 'lucide-react';

const cards = [
  { label: 'Level', value: '07', detail: '680 / 1000 XP', icon: Sparkles },
  { label: 'Streak', value: '12 days', detail: 'Momentum active', icon: Flame },
  { label: 'Active goals', value: '4', detail: '2 high priority', icon: Target },
  { label: 'AI agents', value: '8', detail: 'Read-only preview', icon: Bot }
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-energy-horizon text-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono tracking-[0.22em] uppercase text-mentra-amber">
              MENTRA // READ-ONLY DEMO
            </div>
            <h1 className="mt-2 text-3xl sm:text-5xl font-display font-extrabold">
              Personal AI Operating System
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              Explore the interface with sample data. No account is created and no real actions are executed.
            </p>
          </div>
          <ShieldCheck className="hidden sm:block h-8 w-8 text-emerald-400" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <Icon className="h-4 w-4 text-mentra-orange" />
              <div className="mt-4 text-[10px] font-mono uppercase text-white/40">{label}</div>
              <div className="mt-1 text-xl font-bold">{value}</div>
              <div className="mt-1 text-xs text-white/45">{detail}</div>
            </div>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-mentra-orange/20 bg-black/55 p-6">
            <div className="flex items-center gap-2 text-mentra-amber">
              <Brain className="h-4 w-4" />
              <span className="text-xs font-mono uppercase">Second Brain</span>
            </div>
            <h2 className="mt-3 text-xl font-display font-bold">Memory + decisions + context</h2>
            <p className="mt-2 text-sm text-white/55">
              Sample memory cards, projects, habits and learning context are shown here without connecting to a real user account.
            </p>
          </div>

          <div className="rounded-3xl border border-mentra-orange/20 bg-black/55 p-6">
            <div className="flex items-center gap-2 text-mentra-amber">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-mono uppercase">Finance HUD</span>
            </div>
            <h2 className="mt-3 text-xl font-display font-bold">₹84,500 monthly income</h2>
            <p className="mt-2 text-sm text-white/55">
              Demo-only numbers illustrate how MENTRA can organize personal and business financial telemetry.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/45 p-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-mentra-amber">
            <Bot className="h-4 w-4" />
            Agent Fleet Preview
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Research', 'Business', 'Finance', 'Memory', 'Calendar', 'Gmail', 'Drive', 'Learning'].map(name => (
              <div key={name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">{name} Agent</div>
                <div className="mt-1 text-[10px] font-mono text-white/35">DEMO PREVIEW</div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber px-5 py-3 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Create / Sign In
          </Link>
          <span className="text-xs text-white/40">
            Real agents and personal data require an authenticated account.
          </span>
        </div>
      </div>
    </main>
  );
}
