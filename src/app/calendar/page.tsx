'use client';

import React from 'react';
import { Calendar, Clock, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function CalendarPage() {
  const focusBlocks = [
    {
      time: '09:00 - 10:30',
      title: 'Ultradian Deep Work: AI Pipeline & Agent Architecture',
      status: 'COMPLETED',
      type: 'DEEP_FOCUS',
      duration: '90 mins'
    },
    {
      time: '11:00 - 12:00',
      title: 'Business Unit Economics & Supplier Reconciliations',
      status: 'COMPLETED',
      type: 'OPERATIONS',
      duration: '60 mins'
    },
    {
      time: '14:30 - 16:00',
      title: 'Protected Deep Work: High-Ticket Acquisition Funnel',
      status: 'ACTIVE',
      type: 'DEEP_FOCUS',
      duration: '90 mins'
    },
    {
      time: '17:00 - 17:45',
      title: 'High-Intensity Calisthenics & Neural Reset Protocol',
      status: 'UPCOMING',
      type: 'RECOVERY',
      duration: '45 mins'
    },
    {
      time: '21:00 - 21:30',
      title: 'Daily Journaling & Tomorrow Strategy Ingestion',
      status: 'UPCOMING',
      type: 'REFLECTION',
      duration: '30 mins'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-mentra-orange" />
            <span>TIME HORIZON & ATTENTION DEFENSE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Protected Focus Schedule
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>90-MIN ULTRADIAN PROTOCOL ARMED</span>
        </div>
      </div>

      {/* Focus Blocks List */}
      <div className="space-y-4">
        {focusBlocks.map((block, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              block.status === 'ACTIVE'
                ? 'glass-panel-orange bg-black/80 border-mentra-orange/40 shadow-[0_0_20px_rgba(91,108,255,0.15)]'
                : block.status === 'COMPLETED'
                ? 'bg-black/40 border-white/5 opacity-70'
                : 'glass-panel bg-black/60 border-white/10'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-mentra-amber">
                <Clock className="w-4 h-4 text-mentra-orange" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{block.time}</span>
                  <span className="text-[10px] font-mono text-white/40 uppercase">({block.duration})</span>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    block.type === 'DEEP_FOCUS' ? 'bg-mentra-orange/15 text-mentra-amber border-mentra-orange/30' : 'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    {block.type}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                  {block.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {block.status === 'ACTIVE' && (
                <span className="px-3 py-1 rounded-full bg-mentra-orange text-white text-xs font-mono font-semibold animate-pulse shadow-[0_0_10px_#5b6cff]">
                  IN FOCUS NOW
                </span>
              )}
              {block.status === 'COMPLETED' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>EXECUTED</span>
                </div>
              )}
              {block.status === 'UPCOMING' && (
                <span className="text-xs font-mono text-white/40">
                  SCHEDULED
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
