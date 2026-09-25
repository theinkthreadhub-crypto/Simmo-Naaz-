'use client';

import React from 'react';
import {
  AlertCircle,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Compass,
  Cpu,
  DollarSign,
  GraduationCap,
  HardDrive,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { MentraAgent } from '@/types/mentra';
import { useMentraStore } from '@/lib/store/mentraStore';

interface AgentStatusCardProps {
  agent: MentraAgent;
}

export default function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const { approveAgentTask } = useMentraStore();
  const awaitingApproval = agent.status === 'WAITING_APPROVAL' || agent.status === 'AWAITING_APPROVAL';

  return (
    <article className={`rounded-[20px] border p-5 sm:p-6 ${
      awaitingApproval ? 'border-[#FFB020]/35 bg-[#FFB020]/5' : 'border-[#292F3B] bg-[#161A22]'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl border border-[#292F3B] bg-[#10131A] flex items-center justify-center text-[#B7FF3C]">
            <AgentIcon name={agent.iconName} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">
              {agent.permissionLevel} permission
            </div>
            <h3 className="mt-1 text-lg uppercase">{agent.name}</h3>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#A1A8B5]">{agent.description}</p>

      {agent.currentTask && (
        <div className="mt-4 rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">Current action</div>
          <div className="mt-1 text-sm text-[#F5F7FA]">{agent.currentTask}</div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#292F3B] pt-4">
        <div className="text-xs text-[#697181]">Last run: {agent.lastRun || '—'}</div>
        {awaitingApproval && (
          <button
            onClick={() => approveAgentTask(agent.id)}
            className="mentra-primary-button px-4 inline-flex items-center gap-2 text-xs"
          >
            <ShieldCheck className="h-4 w-4" />
            Approve & run
          </button>
        )}
      </div>
    </article>
  );
}

function AgentIcon({ name }: { name: string }) {
  const cls = 'h-[18px] w-[18px]';
  switch (name) {
    case 'Compass':
      return <Compass className={cls} />;
    case 'Mail':
      return <Mail className={cls} />;
    case 'Calendar':
      return <Calendar className={cls} />;
    case 'HardDrive':
      return <HardDrive className={cls} />;
    case 'DollarSign':
      return <DollarSign className={cls} />;
    case 'GraduationCap':
      return <GraduationCap className={cls} />;
    case 'Briefcase':
      return <Briefcase className={cls} />;
    default:
      return <Cpu className={cls} />;
  }
}

function StatusBadge({ status }: { status: MentraAgent['status'] }) {
  const waiting = status === 'WAITING_APPROVAL' || status === 'AWAITING_APPROVAL';
  const working = status === 'WORKING';
  const ready = status === 'READY' || status === 'MONITORING';

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.08em] flex items-center gap-1.5 ${
      waiting
        ? 'border-[#FFB020]/35 bg-[#FFB020]/10 text-[#FFB020]'
        : ready
          ? 'border-[#4DDB8A]/30 bg-[#4DDB8A]/10 text-[#4DDB8A]'
          : 'border-[#292F3B] bg-[#10131A] text-[#A1A8B5]'
    }`}>
      {working ? <Loader2 className="h-3 w-3 animate-spin" /> : waiting ? <AlertCircle className="h-3 w-3" /> : ready ? <CheckCircle2 className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      {status.replaceAll('_', ' ')}
    </span>
  );
}
