'use client';

import React from 'react';
import { CheckCircle2, CircleDot, Target, Wallet, GraduationCap, Bot } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function ReportsPage() {
  const { user, profile, progress } = useAuth();
  const { player, finance, quests, skills, goals, agents } = useMentraStore();

  const displayLevel = progress?.level ?? player.level;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'You';

  const completedTasks = quests.filter((q) => q.status === 'COMPLETED');
  const activeTasks = quests.filter((q) => q.status === 'ACTIVE');
  const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS');
  const activeSkills = skills.filter((s) => s.unlocked);
  const approvals = agents.filter(
    (a) => a.status === 'WAITING_APPROVAL' || a.status === 'AWAITING_APPROVAL'
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-6">
      <header className="border-b border-[#292F3B] pb-6">
        <div className="mentra-label">Reports</div>
        <h1 className="mt-2 text-3xl sm:text-5xl uppercase">Your current picture.</h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-[#A1A8B5]">
          A factual snapshot of what MENTRA currently has in your system. No invented scores or activity.
        </p>
      </header>

      <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mentra-label">{displayName}</div>
            <h2 className="mt-2 text-2xl sm:text-3xl uppercase">System summary</h2>
          </div>
          <span className="rounded-full border border-[#B7FF3C]/30 bg-[#B7FF3C]/10 px-3 py-1.5 text-xs font-mono text-[#B7FF3C]">
            LEVEL {displayLevel}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ReportMetric icon={<CircleDot className="h-4 w-4" />} label="Active tasks" value={String(activeTasks.length)} />
          <ReportMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Completed tasks" value={String(completedTasks.length)} />
          <ReportMetric icon={<Target className="h-4 w-4" />} label="Goals in progress" value={String(activeGoals.length)} />
          <ReportMetric icon={<GraduationCap className="h-4 w-4" />} label="Unlocked skills" value={String(activeSkills.length)} />
          <ReportMetric icon={<Wallet className="h-4 w-4" />} label="Monthly savings" value={`₹${finance.monthlySavings.toLocaleString()}`} />
          <ReportMetric icon={<Bot className="h-4 w-4" />} label="Agent approvals" value={String(approvals.length)} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#292F3B] bg-[#10131A] p-5 sm:p-6">
          <div className="mentra-label">Goals</div>
          <h2 className="mt-2 text-2xl uppercase">Progress</h2>
          <div className="mt-5 space-y-4">
            {activeGoals.length > 0 ? activeGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-[#292F3B] bg-[#161A22] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold">{goal.title}</div>
                  <div className="font-mono text-xs text-[#B7FF3C]">{goal.progressPercent}%</div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#090B0F]">
                  <div className="h-full rounded-full bg-[#B7FF3C]" style={{ width: `${Math.min(100, goal.progressPercent)}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#697181]">No goals are currently in progress.</p>
            )}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#292F3B] bg-[#10131A] p-5 sm:p-6">
          <div className="mentra-label">Money</div>
          <h2 className="mt-2 text-2xl uppercase">Monthly snapshot</h2>
          <dl className="mt-5 space-y-3">
            <MoneyRow label="Income" value={finance.monthlyIncome} />
            <MoneyRow label="Expenses" value={finance.monthlyExpenses} />
            <MoneyRow label="Savings" value={finance.monthlySavings} accent />
            <MoneyRow label="Budget remaining" value={finance.budgetRemaining} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function ReportMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
      <div className="flex items-center gap-2 text-[#697181]">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-display">{value}</div>
    </div>
  );
}

function MoneyRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#292F3B] bg-[#161A22] px-4 py-3">
      <dt className="text-sm text-[#A1A8B5]">{label}</dt>
      <dd className={`font-mono text-sm font-semibold ${accent ? 'text-[#B7FF3C]' : 'text-[#F5F7FA]'}`}>
        ₹{value.toLocaleString()}
      </dd>
    </div>
  );
}
