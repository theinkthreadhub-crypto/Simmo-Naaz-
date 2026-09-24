'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
}

export default function StatCard({ label, value, subtext, badge, color = 'cyan' }: StatCardProps) {
  const colorMap = {
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
    violet: 'text-violet-400 border-violet-500/30 bg-violet-950/20',
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    rose: 'text-rose-400 border-rose-500/30 bg-rose-950/20'
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1017]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
        <span className="uppercase tracking-wider">{label}</span>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorMap[color]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-display ${colorMap[color].split(' ')[0]}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-slate-500 mt-1 font-mono">
          {subtext}
        </div>
      )}
    </div>
  );
}
