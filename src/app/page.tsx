'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  Sparkles,
  Target,
  Wallet,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import CommandBar from '@/components/mentra/CommandBar';
import SystemStatus from '@/components/mentra/SystemStatus';
import QuestCard from '@/components/quests/QuestCard';
import FinanceCard from '@/components/finance/FinanceCard';
import SkillNode from '@/components/skills/SkillNode';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function HomePage() {
  const { user, profile, progress } = useAuth();
  const { quests, goals, skills, finance, agents, player } = useMentraStore();

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'there';
  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const nextLevelXp = player.nextLevelXp || 1000;

  const activeTasks = quests.filter((q) => q.status === 'ACTIVE');
  const completedTasks = quests.filter((q) => q.status === 'COMPLETED');
  const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS');
  const awaitingApproval = agents.filter(
    (a) => a.status === 'WAITING_APPROVAL' || a.status === 'AWAITING_APPROVAL'
  );
  const activeAgents = agents.filter(
    (a) => a.status === 'WORKING' || a.status === 'READY' || a.status === 'MONITORING'
  );
  const currentSkill = skills.find((skill) => skill.unlocked);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const xpPercent = Math.min(100, Math.round((displayXp / Math.max(nextLevelXp, 1)) * 100));

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-5 lg:py-8 space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[20px] border border-[#292F3B] bg-[#10131A] p-5 sm:p-7 lg:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#292F3B] bg-[#161A22] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A8B5]">
              [ TODAY ]
            </span>
            <span className="rounded-full border border-[#292F3B] bg-[#161A22] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A8B5]">
              [ LEVEL {displayLevel} ]
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-7xl leading-[0.98] uppercase">
            {greeting},<br />
            <span className="text-[#B7FF3C]">{displayName}.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-[#A1A8B5]">
            One place for what matters now, what is next, and what MENTRA can help you move forward.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/mentra"
              className="mentra-primary-button px-5 inline-flex items-center gap-2 text-sm"
            >
              Ask MENTRA
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/quests"
              className="mentra-secondary-button px-5 inline-flex items-center gap-2 text-sm"
            >
              Open tasks
            </Link>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mentra-label">Your system</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Active tasks" value={activeTasks.length} icon={<CircleDot className="h-4 w-4" />} />
              <Metric label="Goals" value={activeGoals.length} icon={<Target className="h-4 w-4" />} />
              <Metric label="Agents ready" value={activeAgents.length} icon={<Bot className="h-4 w-4" />} />
              <Metric label="Completed" value={completedTasks.length} icon={<CheckCircle2 className="h-4 w-4" />} />
            </div>
          </div>

          <div className="mt-6 border-t border-[#292F3B] pt-5">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-mono uppercase tracking-[0.12em] text-[#697181]">Level progress</span>
              <span className="font-mono text-[#F5F7FA]">{displayXp} / {nextLevelXp} XP</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#090B0F]">
              <div className="h-full rounded-full bg-[#B7FF3C]" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <SystemStatus />

      <section className="rounded-[20px] border border-[#292F3B] bg-[#10131A] p-4 sm:p-5">
        <div className="mb-4">
          <div className="mentra-label">Command</div>
          <h2 className="mt-1 text-xl sm:text-2xl uppercase">What do you need?</h2>
        </div>
        <CommandBar />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Now"
            title="Priority stack"
            href="/quests"
            linkText="All tasks"
          />

          {activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.slice(0, 3).map((task) => (
                <QuestCard key={task.id} quest={task} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Clear for now."
              copy="There are no active tasks in your current system."
              href="/quests"
              action="Open tasks"
            />
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader eyebrow="Direction" title="Current goal" href="/goals" linkText="All goals" />
          {activeGoals[0] ? (
            <div className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mentra-label">{activeGoals[0].category}</div>
                  <h3 className="mt-2 text-xl sm:text-2xl uppercase">{activeGoals[0].title}</h3>
                </div>
                <span className="font-mono text-sm text-[#B7FF3C]">
                  {activeGoals[0].progressPercent}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#A1A8B5]">
                {activeGoals[0].description}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#090B0F]">
                <div
                  className="h-full rounded-full bg-[#B7FF3C]"
                  style={{ width: `${Math.min(100, activeGoals[0].progressPercent)}%` }}
                />
              </div>
              <Link href="/goals" className="mt-5 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-[#B7FF3C]">
                Continue goal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <EmptyState title="No goal yet." copy="Create a direction for MENTRA to organize around." href="/goals" action="Create goal" />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Money" title="This month" href="/finance" linkText="Open finance" />
        <FinanceCard summary={finance} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionHeader eyebrow="Learning" title="Next skill" href="/skills" linkText="Learning" />
          {currentSkill ? (
            <SkillNode skill={currentSkill} />
          ) : (
            <EmptyState title="Nothing queued." copy="Choose a skill when you are ready to learn." href="/skills" action="Browse learning" />
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader
            eyebrow="Agents"
            title={awaitingApproval.length > 0 ? 'Needs your approval' : 'Agent activity'}
            href="/agents"
            linkText="All agents"
          />
          {awaitingApproval[0] ? (
            <AgentStatusCard agent={awaitingApproval[0]} />
          ) : activeAgents[0] ? (
            <AgentStatusCard agent={activeAgents[0]} />
          ) : (
            <EmptyState title="No agent action." copy="There is nothing requiring your attention right now." href="/agents" action="Open agents" />
          )}
        </div>
      </section>

      <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="mentra-label">MENTRA brief</div>
            <h2 className="mt-2 text-2xl sm:text-3xl uppercase">What matters now</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <BriefItem icon={<Target className="h-4 w-4" />} label="Tasks" text={`${activeTasks.length} active`} />
            <BriefItem icon={<Wallet className="h-4 w-4" />} label="Budget left" text={`₹${finance.budgetRemaining.toLocaleString()}`} />
            <BriefItem
              icon={awaitingApproval.length > 0 ? <ShieldAlert className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
              label={awaitingApproval.length > 0 ? 'Approval' : 'Learning'}
              text={awaitingApproval.length > 0 ? `${awaitingApproval.length} waiting` : currentSkill?.name || 'No active skill'}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
      <div className="flex items-center justify-between text-[#697181]">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em]">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-display">{value}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="mentra-label">{eyebrow}</div>
        <h2 className="mt-1 text-2xl sm:text-3xl uppercase">{title}</h2>
      </div>
      <Link href={href} className="min-h-11 inline-flex items-center gap-1.5 text-sm text-[#A1A8B5] hover:text-[#B7FF3C]">
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState({
  title,
  copy,
  href,
  action,
}: {
  title: string;
  copy: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#3A424F] bg-[#10131A] p-6 sm:p-8">
      <h3 className="text-xl uppercase">{title}</h3>
      <p className="mt-2 text-sm text-[#A1A8B5]">{copy}</p>
      <Link href={href} className="mt-5 mentra-secondary-button px-4 inline-flex items-center gap-2 text-sm">
        {action}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function BriefItem({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
      <div className="flex items-center gap-2 text-[#B7FF3C]">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-3 text-sm font-semibold text-[#F5F7FA] line-clamp-2">{text}</div>
    </div>
  );
}
