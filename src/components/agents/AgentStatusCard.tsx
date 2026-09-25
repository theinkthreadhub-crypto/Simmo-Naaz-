'use client';

import React from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  Compass, 
  Mail, 
  Calendar, 
  HardDrive, 
  DollarSign, 
  GraduationCap, 
  Briefcase, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';
import { MentraAgent } from '@/types/mentra';
import { useMentraStore } from '@/lib/store/mentraStore';

interface AgentStatusCardProps {
  agent: MentraAgent;
}

export default function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const { approveAgentTask } = useMentraStore();

  const getAgentIcon = () => {
    switch (agent.iconName) {
      case 'Compass':
        return <Compass className="w-4 h-4 text-mentra-orange" />;
      case 'Mail':
        return <Mail className="w-4 h-4 text-mentra-amber" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-amber-200" />;
      case 'HardDrive':
        return <HardDrive className="w-4 h-4 text-white/80" />;
      case 'DollarSign':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-mentra-amber" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-mentra-orange" />;
      default:
        return <Cpu className="w-4 h-4 text-mentra-orange" />;
    }
  };

  const getStatusBadge = () => {
    switch (agent.status) {
      case 'WORKING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-mentra-orange/15 text-mentra-amber border border-mentra-orange/30 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>WORKING</span>
          </span>
        );
      case 'WAITING_APPROVAL':
      case 'AWAITING_APPROVAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>APPROVAL REQ</span>
          </span>
        );
      case 'READY':
      case 'MONITORING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>{agent.status}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/5 text-white/50 border border-white/10">
            <span>{agent.status}</span>
          </span>
        );
    }
  };

  const isAwaitingApproval = agent.status === 'WAITING_APPROVAL' || agent.status === 'AWAITING_APPROVAL';

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
      isAwaitingApproval
        ? 'glass-panel-orange bg-black/80 border-mentra-orange/40 shadow-[0_0_25px_rgba(255,74,0,0.2)]'
        : 'glass-panel bg-black/60 border-white/10 hover:border-mentra-orange/30'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            {getAgentIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase">
                {agent.permissionLevel} PRIVILEGE
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-display mt-0.5">
              {agent.name}
            </h3>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      <p className="mt-2.5 text-xs text-white/70 leading-relaxed font-sans">
        {agent.description}
      </p>

      {/* Current Task Telemetry */}
      {agent.currentTask && (
        <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-xs font-mono">
          <span className="text-mentra-amber font-semibold text-[10px] uppercase flex-shrink-0 mt-0.5">TASK:</span>
          <span className="text-white/80 text-[11px] leading-relaxed truncate">{agent.currentTask}</span>
        </div>
      )}

      {/* Human-in-the-Loop Approval Action Gate */}
      {isAwaitingApproval && (
        <div className="mt-4 pt-3 border-t border-mentra-orange/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-mentra-orange" />
            <span>Action requires operator sign-off</span>
          </div>
          <button
            onClick={() => approveAgentTask(agent.id)}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber hover:opacity-90 active:scale-95 text-white text-xs font-semibold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,74,0,0.4)]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>APPROVE & RUN</span>
          </button>
        </div>
      )}
    </div>
  );
}
