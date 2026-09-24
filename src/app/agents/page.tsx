'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Cpu,
  Shield,
  CheckCircle2,
  AlertCircle,
  Play,
  Activity,
  Compass,
  Mail,
  Calendar,
  HardDrive,
  DollarSign,
  GraduationCap,
  Briefcase,
  Lock,
  Unlock
} from 'lucide-react';

export default function AgentsPage() {
  const agents = useMentraStore((state) => state.agents);
  const approveAgentTask = useMentraStore((state) => state.approveAgentTask);
  const updateAgentStatus = useMentraStore((state) => state.updateAgentStatus);

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Research Agent': return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'Gmail Agent': return <Mail className="w-5 h-5 text-rose-400" />;
      case 'Calendar Agent': return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Drive & Assets Agent': return <HardDrive className="w-5 h-5 text-blue-400" />;
      case 'Finance Agent': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'Learning Agent': return <GraduationCap className="w-5 h-5 text-violet-400" />;
      case 'Business Agent': return <Briefcase className="w-5 h-5 text-cyan-300" />;
      default: return <Cpu className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WORKING':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 animate-pulse">WORKING</span>;
      case 'MONITORING':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">MONITORING</span>;
      case 'AWAITING_APPROVAL':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50 font-bold animate-bounce">AWAITING APPROVAL</span>;
      case 'READY':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">READY</span>;
      default:
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">IDLE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Cpu className="w-4 h-4" /> MENTRA AUTONOMOUS FLEET
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Command Operations</h1>
            <p className="text-slate-400 text-sm mt-1">
              Coordinated specialized autonomous agents with strict permission models: READ → ANALYZE → RECOMMEND → ASK APPROVAL → EXECUTE.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">SECURITY ARCHITECTURE</span>
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
              className={`p-6 rounded-2xl bg-[#0d101a] border ${
                agent.status === 'AWAITING_APPROVAL'
                  ? 'border-amber-500/50 shadow-xl shadow-amber-500/10'
                  : 'border-slate-800 hover:border-violet-500/40'
              } transition-all space-y-4 flex flex-col justify-between`}
            >
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      {getAgentIcon(agent.name)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{agent.name}</h3>
                      <div className="text-[11px] font-mono text-cyan-400">{agent.role}</div>
                    </div>
                  </div>

                  {getStatusBadge(agent.status)}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">
                  {agent.description}
                </p>

                {/* Current Task Box */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase">CURRENT OPERATION:</span>
                  <p className="text-slate-200">{agent.currentTask}</p>
                </div>
              </div>

              {/* Bottom telemetry & Approval controls */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  <span>PERMISSION: {agent.permissionLevel}</span>
                </div>

                {agent.status === 'AWAITING_APPROVAL' ? (
                  <button
                    onClick={() => approveAgentTask(agent.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Execution
                  </button>
                ) : (
                  <button
                    onClick={() => updateAgentStatus(agent.id, 'WORKING', 'Scouting real-time market data...')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Play className="w-3 h-3 text-cyan-400" /> Dispatch Ping
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
