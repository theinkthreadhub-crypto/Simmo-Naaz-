'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import { Activity, Cpu, ShieldCheck, Server, Zap, Radio, CheckCircle2 } from 'lucide-react';

export default function SystemPage() {
  const player = useMentraStore((state) => state.player);
  const agents = useMentraStore((state) => state.agents);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          {/* Header */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Activity className="w-4 h-4" /> MENTRA OPERATING SYSTEM
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">System Core & Diagnostics</h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time telemetry, neural agent dispatch channels, system health, and secure kernel execution status.
            </p>
          </div>

          <CommandBar />

          {/* Core System Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Server className="w-4 h-4" /> KERNEL STATE
                </span>
                <span className="text-emerald-400 font-bold">OPTIMAL</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">MENTRA v2.4.0</div>
              <p className="text-xs text-slate-400">
                Next.js 14 App Router + Supabase PostgreSQL + React Three Fiber 3D Runtime.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-violet-400">
                  <Cpu className="w-4 h-4" /> AGENT CLUSTER
                </span>
                <span className="text-cyan-400 font-bold">{agents.length} ACTIVE</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">8 / 8 DISPATCHED</div>
              <p className="text-xs text-slate-400">
                Human-in-the-loop permission gates active with zero unverified external executions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Radio className="w-4 h-4" /> TELEMETRY UPTIME
                </span>
                <span className="text-emerald-400 font-bold">99.98%</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">14 DAYS ACTIVE</div>
              <p className="text-xs text-slate-400">
                Continuous background state sync & vector memory indexing.
              </p>
            </div>
          </div>

          {/* Neural Channel Status */}
          <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Neural State Machines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {['Intent Parser: ACTIVE', 'Voice Telemetry: READY', 'Vector Embeddings: CONNECTED', 'WhatsApp Gateway: ONLINE'].map((state, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-300">{state}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
