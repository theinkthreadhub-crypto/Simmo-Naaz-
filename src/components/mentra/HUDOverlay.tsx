'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { Shield, Flame, Zap, Award, Sparkles, Activity } from 'lucide-react';

export default function HUDOverlay() {
  const player = useMentraStore((state) => state.player);
  const agents = useMentraStore((state) => state.agents);
  const activeAgentsCount = agents.filter(a => a.status === 'WORKING' || a.status === 'MONITORING').length;

  const xpPercent = Math.min(100, Math.round((player.currentXp / player.nextLevelXp) * 100));

  return (
    <div className="w-full bg-[#0c0e17]/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Player Identity & Level */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shadow-inner">
              LV.{player.level < 10 ? `0${player.level}` : player.level}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0c0e17] rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-wide">{player.name}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                {player.rank}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              CODENAME: <span className="text-slate-200">{player.codename}</span>
            </div>
          </div>
        </div>

        {/* Center: XP Progression Bar */}
        <div className="flex-1 min-w-[200px] max-w-md hidden md:block">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="w-3.5 h-3.5" /> REPUTATION & XP
            </span>
            <span>
              {player.currentXp} / {player.nextLevelXp} XP ({xpPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Streak & Agent Telemetry */}
        <div className="flex items-center gap-3 font-mono">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <Flame className="w-4 h-4 fill-amber-400/20" />
            <span className="font-bold">{player.streakDays} DAY STREAK</span>
          </div>

          {/* Active Agents Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs">
            <Activity className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">AGENTS ONLINE:</span>
            <span className="font-bold text-white">{activeAgentsCount} / {agents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
