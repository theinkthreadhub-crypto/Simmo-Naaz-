'use client';

import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FinanceSummary } from '@/types/mentra';

interface FinanceCardProps {
  summary: FinanceSummary;
}

export default function FinanceCard({ summary }: FinanceCardProps) {
  const isHealthy = summary.monthlySavings >= 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-panel-orange bg-black/70 border-white/15 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              CAPITAL VELOCITY HUD
            </h3>
            <span className="text-[10px] font-mono text-white/40">REAL-TIME RUNWAY SENTINEL</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
          isHealthy 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {isHealthy ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{isHealthy ? 'SOLVENT' : 'DEFICIT'}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>INCOME</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
            ₹{summary.monthlyIncome.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
            <ArrowDownRight className="w-3 h-3 text-rose-400" />
            <span>EXPENSES</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-rose-400 mt-1">
            ₹{summary.monthlyExpenses.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
            <TrendingUp className="w-3 h-3 text-mentra-amber" />
            <span>NET SAVINGS</span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
            ₹{summary.monthlySavings.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="text-[10px] font-mono text-white/50">
            BUDGET LEFT
          </div>
          <div className="text-lg sm:text-xl font-mono font-bold text-mentra-amber mt-1">
            ₹{summary.budgetRemaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* AI Sentinel Telemetry Insight */}
      <div className="mt-4 p-3 rounded-xl bg-mentra-orange/10 border border-mentra-orange/20 flex items-start gap-2.5">
        <span className="w-2 h-2 rounded-full bg-mentra-orange animate-pulse mt-1.5 flex-shrink-0 shadow-[0_0_6px_#5b6cff]" />
        <p className="text-xs text-white/80 font-mono leading-relaxed">
          <span className="text-mentra-amber font-semibold">SENTINEL INSIGHT:</span> {summary.aiInsight}
        </p>
      </div>
    </div>
  );
}
