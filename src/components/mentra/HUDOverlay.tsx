'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { Flame, Zap, Activity } from 'lucide-react';

export default function HUDOverlay() {
  const player = useMentraStore((state) => state.player);
  const agents = useMentraStore((state) => state.agents);
  const activeAgentsCount = agents.filter(a => a.status === 'WORKING' || a.status === 'MONITORING').length;

  const xpPercent = Math.min(100, Math.round((player.currentXp / player.nextLevelXp) * 100));

  return (
    <div className="w-full bg-[#070a12]/70 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Player Identity & Level */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b6cff]/30 to-[#67e8f9]/20 border border-[#67e8f9]/40 flex items-center justify-center text-[#67e8f9] font-mono font-bold text-xs shadow-inner">
              LV.{player.level < 10 ? `0${player.level}` : player.level}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#070a12] rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-wide">{player.name}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#5b6cff]/20 text-[#67e8f9] border border-[#5b6cff]/30">
                {player.rank}
              </span>
            </div>
            <div className="text-[11px] text-white/50 font-mono">
              CODENAME: <span className="text-white/80">{player.codename}</span>
            </div>
          </div>
        </div>

        {/* Center: XP Progression Bar */}
        <div className="flex-1 min-w-[200px] max-w-md hidden md:block">
          <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-1">
            <span className="flex items-center gap-1 text-[#67e8f9]">
              <Zap className="w-3.5 h-3.5" /> REPUTATION & XP
            </span>
            <span>
              {player.currentXp} / {player.nextLevelXp} XP ({xpPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5b6cff] to-[#67e8f9] shadow-sm shadow-[#5b6cff]/50 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Streak & Agent Telemetry */}
        <div className="flex items-center gap-3 font-mono">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
            <Flame className="w-3.5 h-3.5 fill-cyan-400/30" />
            <span className="font-bold">{player.streakDays} DAY STREAK</span>
          </div>

          {/* Active Agents Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/80 text-xs">
            <Activity className="w-3.5 h-3.5 text-[#67e8f9] animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">AGENTS ONLINE:</span>
            <span className="font-bold text-white">{activeAgentsCount} / {agents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
