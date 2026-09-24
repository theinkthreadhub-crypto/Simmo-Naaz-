'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import { Cpu } from 'lucide-react';

export default function AgentsPage() {
  const agents = useMentraStore((state) => state.agents);
  const approveAgentTask = useMentraStore((state) => state.approveAgentTask);
  const updateAgentStatus = useMentraStore((state) => state.updateAgentStatus);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-violet-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
                <Cpu className="w-4 h-4" /> MENTRA AUTONOMOUS FLEET
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Command Operations</h1>
              <p className="text-slate-400 text-sm mt-1">
                Coordinated specialized autonomous agents with strict permission models: READ → ANALYZE → RECOMMEND → ASK APPROVAL → EXECUTE.
              </p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#0d1017] border border-white/10 text-xs font-mono">
              <span className="text-slate-500 block text-[10px]">SECURITY ARCHITECTURE</span>
              <span className="text-emerald-400 font-bold">HUMAN-IN-THE-LOOP ACTIVE</span>
            </div>
          </div>

          <CommandBar />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map((agent) => (
              <AgentStatusCard
                key={agent.id}
                agent={agent}
                onApprove={approveAgentTask}
                onPing={(id) => updateAgentStatus(id, 'WORKING', 'Scouting real-time market data...')}
              />
            ))}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
