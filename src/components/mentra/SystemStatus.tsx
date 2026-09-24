'use client';

import React from 'react';
import { Terminal, Shield, Zap, Sparkles } from 'lucide-react';

interface SystemStatusProps {
  level: number;
  xp: number;
  nextLevelXp: number;
  streakDays: number;
  message?: string;
}

export default function SystemStatus({
  level,
  xp,
  nextLevelXp,
  streakDays,
  message = 'Today you have 2 business missions, 1 finance task and 20 minutes of learning.'
}: SystemStatusProps) {
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <div className="w-full p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Corner HUD accents */}
      <div className="hud-corner" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            MENTRA ONLINE • GOOD MORNING
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personal Command Center</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            <span className="text-slate-400 block text-[10px]">LEVEL</span>
            <span className="font-bold text-base text-cyan-400">LV.{level < 10 ? `0${level}` : level}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300">
            <span className="text-slate-400 block text-[10px]">STREAK</span>
            <span className="font-bold text-base text-amber-400">{streakDays} DAYS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
