'use client';

import React from 'react';
import { CheckCircle2, Flame, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function SystemStatus() {
  const { user, profile, progress } = useAuth();
  const { quests, agents, player } = useMentraStore();

  const activeTasks = quests.filter((q) => q.status === 'ACTIVE').length;
  const approvals = agents.filter(
    (a) => a.status === 'WAITING_APPROVAL' || a.status === 'AWAITING_APPROVAL'
  ).length;
  const displayLevel = progress?.level ?? player.level;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'You';

  return (
    <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4DDB8A]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">
              System active
            </span>
          </div>
          <h2 className="mt-3 text-xl sm:text-2xl uppercase">
            {displayName}, your current system is ready.
          </h2>
          <p className="mt-2 text-sm text-[#A1A8B5]">
            {activeTasks > 0 ? `${activeTasks} active task${activeTasks === 1 ? '' : 's'}` : 'No active tasks'}
            {approvals > 0 ? ` · ${approvals} agent approval${approvals === 1 ? '' : 's'} waiting` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatusStat icon={<Target className="h-4 w-4" />} label="Level" value={String(displayLevel)} />
          <StatusStat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${displayStreak}d`} />
          <div className="col-span-2 sm:col-span-1">
            <StatusStat icon={<CheckCircle2 className="h-4 w-4" />} label="Approvals" value={String(approvals)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[110px] rounded-2xl border border-[#292F3B] bg-[#10131A] p-3">
      <div className="flex items-center gap-2 text-[#697181]">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
