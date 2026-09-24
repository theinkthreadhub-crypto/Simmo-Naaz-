'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface XPBarProps {
  currentXp: number;
  nextLevelXp: number;
  label?: string;
}

export default function XPBar({ currentXp, nextLevelXp, label = 'REPUTATION & XP' }: XPBarProps) {
  const percent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="w-full space-y-1.5 font-mono text-xs">
      <div className="flex items-center justify-between text-slate-400">
        <span className="flex items-center gap-1 text-cyan-400 font-semibold">
          <Zap className="w-3.5 h-3.5" /> {label}
        </span>
        <span>
          {currentXp} / {nextLevelXp} XP ({percent}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 shadow-sm shadow-cyan-500/50 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
