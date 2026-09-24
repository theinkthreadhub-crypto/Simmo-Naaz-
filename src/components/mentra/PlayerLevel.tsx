'use client';

import React from 'react';
import { Shield, Zap } from 'lucide-react';

interface PlayerLevelProps {
  level: number;
  rank: string;
  codename: string;
  name: string;
}

export default function PlayerLevel({ level, rank, codename, name }: PlayerLevelProps) {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shadow-inner">
        LV.{level < 10 ? `0${level}` : level}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            {rank}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          CODENAME: <span className="text-slate-200">{codename}</span>
        </div>
      </div>
    </div>
  );
}
