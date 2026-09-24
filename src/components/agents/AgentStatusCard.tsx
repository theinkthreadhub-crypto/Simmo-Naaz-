'use client';

import React from 'react';
import { MentraAgent } from '@/types/mentra';
import { Cpu, Shield, CheckCircle2, Play, Compass, Mail, Calendar, HardDrive, DollarSign, GraduationCap, Briefcase } from 'lucide-react';

interface AgentStatusCardProps {
  agent: MentraAgent;
  onApprove?: (id: string) => void;
  onPing?: (id: string) => void;
}

export default function AgentStatusCard({ agent, onApprove, onPing }: AgentStatusCardProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Research Agent': return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'Gmail Agent': return <Mail className="w-4 h-4 text-rose-400" />;
      case 'Calendar Agent': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'Drive & Assets Agent': return <HardDrive className="w-4 h-4 text-blue-400" />;
      case 'Finance Agent': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'Learning Agent': return <GraduationCap className="w-4 h-4 text-violet-400" />;
      case 'Business Agent': return <Briefcase className="w-4 h-4 text-cyan-300" />;
      default: return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      className={`p-5 rounded-3xl bg-[#0d1017]/90 border ${
        agent.status === 'AWAITING_APPROVAL'
          ? 'border-amber-500/50 shadow-xl shadow-amber-500/10'
          : 'border-white/10 hover:border-cyan-500/40'
      } backdrop-blur-xl transition-all space-y-3 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              {getIcon(agent.name)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{agent.name}</h4>
              <span className="text-[10px] font-mono text-cyan-400">{agent.role}</span>
            </div>
          </div>

          <span
            className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
              agent.status === 'WORKING'
                ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 animate-pulse'
                : agent.status === 'AWAITING_APPROVAL'
                ? 'bg-amber-950 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {agent.status}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 font-sans">
          {agent.description}
        </p>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5 text-xs font-mono">
          <span className="text-[9px] text-slate-500 uppercase">CURRENT OP:</span>
          <p className="text-slate-300 line-clamp-1">{agent.currentTask}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <span className="text-[10px] text-slate-500">
          PERM: <strong className="text-violet-400">{agent.permissionLevel}</strong>
        </span>

        {agent.status === 'AWAITING_APPROVAL' ? (
          <button
            onClick={() => onApprove && onApprove(agent.id)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition text-xs font-bold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </button>
        ) : (
          <button
            onClick={() => onPing && onPing(agent.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
          >
            <Play className="w-3 h-3 text-cyan-400" /> Ping
          </button>
        )}
      </div>
    </div>
  );
}
