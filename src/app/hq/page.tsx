'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Bot,
  Brain,
  CalendarDays,
  CircleDollarSign,
  HardDrive,
  NotebookPen,
  Sparkles,
  Sword,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const MentraHQScene = dynamic(() => import('@/components/hq/MentraHQScene'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-white/10 bg-[#060806]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#d8ff63]/25 blur-xl" />
        <div className="mt-4 text-[10px] font-mono tracking-[0.2em] text-[#d8ff63]">
          BOOTING 3D HQ...
        </div>
      </div>
    </div>
  ),
});

const quickModules = [
  { href: '/mentra', label: 'AI Mentor', icon: Sparkles },
  { href: '/quests', label: 'Quests', icon: Sword },
  { href: '/memory', label: 'Memory', icon: HardDrive },
  { href: '/finance', label: 'Finance', icon: CircleDollarSign },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/journal', label: 'Journal', icon: NotebookPen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/agents', label: 'Agents', icon: Bot },
];

export default function MentraHQPage() {
  const { profile, progress } = useAuth();
  const operatorName = profile?.display_name || 'Operator';
  const level = progress?.level ?? 1;
  const streak = progress?.current_streak ?? 0;
  const xp = progress?.current_xp ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5 lg:px-8">
      <section className="mb-5 flex flex-col gap-4 sm:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#d8ff63]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff63] shadow-[0_0_14px_rgba(216,255,99,0.7)]" />
            Personal command center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f4f1e8] sm:text-4xl lg:text-5xl">
            Welcome to your HQ, {operatorName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
            Your goals, memory, money, skills and agents now live inside one interactive workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['LEVEL', String(level)],
            ['STREAK', `${streak}D`],
            ['XP', String(xp)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2.5 backdrop-blur-xl">
              <div className="text-[9px] font-mono tracking-[0.2em] text-white/30">{label}</div>
              <div className="mt-0.5 text-sm font-semibold text-[#d8ff63]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative">
        <MentraHQScene />
      </section>

      <section className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:grid-cols-8">
        {quickModules.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-2 py-3 text-center transition hover:border-[#d8ff63]/30 hover:bg-[#d8ff63]/[0.055]"
          >
            <Icon className="h-4 w-4 text-white/40 transition group-hover:text-[#d8ff63]" />
            <span className="text-[10px] font-medium text-white/55 transition group-hover:text-white sm:text-[11px]">
              {label}
            </span>
          </Link>
        ))}
      </section>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-center text-[10px] font-mono leading-5 tracking-[0.08em] text-white/28 sm:hidden">
        TIP: DRAG THE ROOM TO LOOK AROUND · TAP A GLOWING OBJECT TO OPEN THAT MODULE
      </div>
    </div>
  );
}
