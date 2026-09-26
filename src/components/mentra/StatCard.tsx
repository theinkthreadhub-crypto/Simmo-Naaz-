'use client';

import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  highlight?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false
}: StatCardProps) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl transition-all relative overflow-hidden ${
      highlight
        ? 'glass-panel-orange bg-black/70 border-mentra-orange/40 shadow-[0_0_20px_rgba(91,108,255,0.15)]'
        : 'glass-panel bg-black/60 border-white/10 hover:border-white/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${
          highlight ? 'bg-mentra-orange/20 border-mentra-orange/40 text-mentra-amber' : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-mono font-medium text-mentra-amber flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-white/60 font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}
