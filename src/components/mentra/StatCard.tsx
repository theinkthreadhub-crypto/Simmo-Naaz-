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
  highlight = false,
}: StatCardProps) {
  return (
    <div className={`rounded-[18px] border p-4 sm:p-5 ${
      highlight
        ? 'border-[#B7FF3C]/30 bg-[#B7FF3C]/5'
        : 'border-[#292F3B] bg-[#161A22]'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">{title}</span>
        <div className="h-9 w-9 rounded-xl border border-[#292F3B] bg-[#10131A] flex items-center justify-center text-[#B7FF3C]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-display">{value}</span>
        {trend && (
          <span className="text-xs font-mono text-[#B7FF3C] flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-[#A1A8B5]">{subtitle}</p>}
    </div>
  );
}
