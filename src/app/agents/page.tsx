'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Bot, Shield, ShieldCheck, Activity, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import { useMentraStore } from '@/lib/store/mentraStore';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center animate-pulse text-mentra-amber font-mono text-xs">SYNCHRONIZING FLEET...</div>
});

export default function AgentsPage() {
  const { agents } = useMentraStore();

  const workingCount = agents.filter(a => a.status === 'WORKING' || a.status === 'READY' || a.status === 'MONITORING').length;
  const approvalCount = agents.filter(a => a.status === 'WAITING_APPROVAL' || a.status === 'AWAITING_APPROVAL').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Bot className="w-4 h-4 text-mentra-orange" />
            <span>AUTONOMOUS FLEET COMMAND</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Agent Cluster Operations
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 px-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-xs font-mono">
            <span className="text-white/40">FLEET HEALTH: </span>
            <span className="text-emerald-400 font-bold">{workingCount} / {agents.length} ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Hero 3D Fleet Visualizer */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-xs font-mono text-mentra-amber">
            <ShieldCheck className="w-3.5 h-3.5 text-mentra-orange" />
            <span>HUMAN-IN-THE-LOOP APPROVAL PROTOCOL</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold font-display text-white">
            Autonomous execution with sovereign operator oversight.
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-sans leading-relaxed">
            Every agent operates within strict permission boundaries (<span className="font-mono text-mentra-amber text-xs">READ → ANALYZE → RECOMMEND → PREPARE → EXECUTE</span>). High-impact financial and communication operations require your cryptographic sign-off.
          </p>
        </div>

        <div className="lg:col-span-5 h-64 relative flex items-center justify-center">
          <MentraCore3D className="w-full h-full" />
        </div>
      </div>

      {/* Agents Matrix Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white">
            ACTIVE AGENT NODES ({agents.length})
          </h3>
          {approvalCount > 0 && (
            <span className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-mentra-orange" />
              <span>{approvalCount} ACTION(S) AWAITING APPROVAL</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

    </div>
  );
}
