'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Cpu,
  Shield,
  CheckCircle2,
  Play,
  Compass,
  Mail,
  Calendar,
  HardDrive,
  DollarSign,
  GraduationCap,
  Briefcase
} from 'lucide-react';

export default function AgentsPage() {
  const agents = useMentraStore((state) => state.agents);
  const approveAgentTask = useMentraStore((state) => state.approveAgentTask);
  const updateAgentStatus = useMentraStore((state) => state.updateAgentStatus);

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Research Agent': return <Compass className="w-5 h-5 text-[#ff8a1f]" />;
      case 'Gmail Agent': return <Mail className="w-5 h-5 text-rose-400" />;
      case 'Calendar Agent': return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Drive & Assets Agent': return <HardDrive className="w-5 h-5 text-blue-400" />;
      case 'Finance Agent': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'Learning Agent': return <GraduationCap className="w-5 h-5 text-violet-400" />;
      case 'Business Agent': return <Briefcase className="w-5 h-5 text-[#ff8a1f]" />;
      default: return <Cpu className="w-5 h-5 text-[#ff8a1f]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WORKING':
        return <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#ff3d00]/20 text-[#ff8a1f] border border-[#ff3d00]/40 animate-pulse">WORKING</span>;
      case 'MONITORING':
        return <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">MONITORING</span>;
      case 'AWAITING_APPROVAL':
        return <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50 font-bold animate-bounce">AWAITING APPROVAL</span>;
      case 'READY':
        return <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10">READY</span>;
      default:
        return <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">IDLE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Cpu className="w-4 h-4" /> MENTRA AUTONOMOUS FLEET
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Agent Command Operations</h1>
            <p className="text-white/60 text-sm mt-1">
              Coordinated specialized autonomous agents with strict permission models: READ → ANALYZE → RECOMMEND → ASK APPROVAL → EXECUTE.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-[rgba(56,20,6,0.5)] border border-white/10 text-xs font-mono">
            <span className="text-white/40 block text-[10px]">SECURITY ARCHITECTURE</span>
            <span className="text-emerald-400 font-bold">HUMAN-IN-THE-LOOP ACTIVE</span>
          </div>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-6 sm:p-7 rounded-3xl bg-[rgba(56,20,6,0.38)] border ${
                agent.status === 'AWAITING_APPROVAL'
                  ? 'border-[#ff8a1f] shadow-2xl shadow-orange-950/60'
                  : 'border-white/15 hover:border-[#ff8a1f]/40'
              } backdrop-blur-xl transition-all space-y-4 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      {getAgentIcon(agent.name)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{agent.name}</h3>
                      <div className="text-[11px] font-mono text-[#ff8a1f]">{agent.role}</div>
                    </div>
                  </div>

                  {getStatusBadge(agent.status)}
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
                  {agent.description}
                </p>

                {/* Current Task Box */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-white/40 uppercase">CURRENT OPERATION:</span>
                  <p className="text-slate-100">{agent.currentTask}</p>
                </div>
              </div>

              {/* Bottom telemetry & Approval controls */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-white/50">
                  <Shield className="w-3.5 h-3.5 text-[#ff8a1f]" />
                  <span>PERMISSION: {agent.permissionLevel}</span>
                </div>

                {agent.status === 'AWAITING_APPROVAL' ? (
                  <button
                    onClick={() => approveAgentTask(agent.id)}
                    className="btn btn--flame !py-1.5 !px-4 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Execution
                  </button>
                ) : (
                  <button
                    onClick={() => updateAgentStatus(agent.id, 'WORKING', 'Scouting real-time market data...')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
                  >
                    <Play className="w-3 h-3 text-[#ff8a1f]" /> Dispatch Ping
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
