'use client';

import React from 'react';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import { Calendar as CalendarIcon, Clock, ShieldCheck, Sparkles } from 'lucide-react';

const scheduleBlocks = [
  { time: '09:00 - 10:30', title: 'Deep Work Block 01: Multi-Agent State Machine', type: 'DEEP_WORK', duration: '90m' },
  { time: '11:00 - 12:00', title: 'Supplier Contract Review & Fabric Quality Terms', type: 'BUSINESS', duration: '60m' },
  { time: '14:00 - 15:30', title: 'Deep Work Block 02: Meta Ads Creative Experiments', type: 'DEEP_WORK', duration: '90m' },
  { time: '16:00 - 16:30', title: 'Daily Journal & Executive Reflection Protocol', type: 'SYSTEM', duration: '30m' },
];

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <CalendarIcon className="w-4 h-4" /> TIME HORIZON & ATTENTION ENGINE
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Calendar & Deep Focus Blocks</h1>
            <p className="text-slate-400 text-sm mt-1">
              Protected 90-minute ultradian deep work cycles scheduled and guarded by the Calendar Agent.
            </p>
          </div>

          <CommandBar />

          {/* Schedule timeline */}
          <div className="space-y-4">
            {scheduleBlocks.map((block, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="px-3.5 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                    {block.time}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{block.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400">DURATION: {block.duration}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/40">
                    PROTECTED BLOCK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
