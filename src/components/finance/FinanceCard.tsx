'use client';

import React from 'react';
import { ArrowDownRight, ArrowUpRight, Lightbulb, Wallet } from 'lucide-react';
import { FinanceSummary } from '@/types/mentra';

interface FinanceCardProps {
  summary: FinanceSummary;
}

export default function FinanceCard({ summary }: FinanceCardProps) {
  return (
    <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-[#292F3B] pb-5">
        <div>
          <div className="mentra-label">Money</div>
          <h3 className="mt-2 text-xl sm:text-2xl uppercase">Monthly snapshot</h3>
        </div>
        <div className="h-10 w-10 rounded-xl border border-[#292F3B] bg-[#10131A] flex items-center justify-center text-[#B7FF3C]">
          <Wallet className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyMetric label="Income" value={summary.monthlyIncome} icon={<ArrowUpRight className="h-3.5 w-3.5" />} />
        <MoneyMetric label="Expenses" value={summary.monthlyExpenses} icon={<ArrowDownRight className="h-3.5 w-3.5" />} />
        <MoneyMetric label="Savings" value={summary.monthlySavings} accent />
        <MoneyMetric label="Budget left" value={summary.budgetRemaining} />
      </div>

      {summary.aiInsight && (
        <div className="mt-4 rounded-2xl border border-[#292F3B] bg-[#10131A] p-4 flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#7C8CFF]" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">MENTRA observation</div>
            <p className="mt-1 text-sm leading-relaxed text-[#A1A8B5]">{summary.aiInsight}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function MoneyMetric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.1em] text-[#697181]">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-lg sm:text-xl font-mono font-semibold ${accent ? 'text-[#B7FF3C]' : 'text-[#F5F7FA]'}`}>
        ₹{value.toLocaleString()}
      </div>
    </div>
  );
}
