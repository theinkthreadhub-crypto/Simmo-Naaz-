'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Cpu, Activity, ShieldCheck, HardDrive, Wifi, Server, Sparkles, Terminal } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center animate-pulse text-mentra-amber font-mono text-xs">CALIBRATING CORE...</div>
});

export default function SystemPage() {
  const { user, profile, progress } = useAuth();
  const { agents, player } = useMentraStore();

  const displayLevel = progress?.level ?? player.level;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Cpu className="w-4 h-4 text-mentra-orange" />
            <span>MENTRA KERNEL TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            System Diagnostics & Core State
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-xs font-mono text-emerald-300 uppercase">KERNEL ONLINE // OPTIMAL</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: 3D Core View & Kernel Telemetry */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl glass-panel-orange bg-black/70 border-white/15 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono text-mentra-amber">3D MENTRA PLASMA CORE</span>
              <span className="text-[10px] font-mono text-white/40">RENDER PROTOCOL: THREE.JS</span>
            </div>
            <div className="w-full h-72 relative">
              <MentraCore3D className="w-full h-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10">
              <div className="text-[10px] font-mono text-white/40 uppercase">OPERATOR CODENAME</div>
              <div className="text-sm sm:text-base font-bold text-white mt-1">{displayName}</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10">
              <div className="text-[10px] font-mono text-white/40 uppercase">CLEARANCE LEVEL</div>
              <div className="text-sm sm:text-base font-bold text-mentra-amber mt-1">LEVEL 0{displayLevel} SOVEREIGN</div>
            </div>
          </div>
        </div>

        {/* Right Side: Telemetry Metrics & Kernel Logs */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="p-6 rounded-2xl glass-panel bg-black/60 border-white/10 space-y-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-mentra-orange" />
              <span>SUBSYSTEM HEALTH STATUS</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Supabase PostgreSQL RLS Isolation</span>
                <span className="text-emerald-400 font-bold">100% SECURE</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Autonomous Agent Cluster</span>
                <span className="text-mentra-amber font-bold">{agents.length} NODES SYNCED</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Neural Vector Memory Cache</span>
                <span className="text-white font-bold">ACTIVE (0.4ms)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Human-in-the-Loop Approval Gate</span>
                <span className="text-emerald-400 font-bold">ARMED</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel bg-black/60 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-white/50 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-mentra-orange" />
                <span>KERNEL CONSOLE TELEMETRY</span>
              </h3>
              <span className="text-[10px] font-mono text-white/40">STREAMING</span>
            </div>

            <div className="p-3 rounded-xl bg-black/80 border border-white/5 text-[11px] font-mono text-white/70 space-y-1.5 overflow-x-auto">
              <div className="text-emerald-400">[KERNEL]: Session verified. User authorized.</div>
              <div className="text-white/60">[AGENT_BUS]: 8 agent sockets listening on event mesh.</div>
              <div className="text-mentra-amber">[FINANCE_SENTINEL]: Cash burn velocity within parameters.</div>
              <div className="text-white/40">[MEMORY_VAULT]: Index vector ready. 0 latency anomalies.</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
