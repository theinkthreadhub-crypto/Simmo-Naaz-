'use client';

import React from 'react';
import { FinanceSummary } from '@/types/mentra';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface FinanceCardProps {
  finance: FinanceSummary;
}

export default function FinanceCard({ finance }: FinanceCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest font-semibold">
          <DollarSign className="w-4 h-4" /> Financial Velocity
        </div>
        <span className="text-[11px] font-mono text-slate-400">Monthly Run-Rate</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>INCOME</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400">{formatCurrency(finance.monthlyIncome)}</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>EXPENSES</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-400">{formatCurrency(finance.monthlyExpenses)}</div>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed font-sans flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-semibold text-cyan-400 text-[10px] block mb-0.5">AI BURNOUT & RUNWAY SENTINEL</span>
          {finance.aiInsight}
        </div>
      </div>
    </div>
  );
}
