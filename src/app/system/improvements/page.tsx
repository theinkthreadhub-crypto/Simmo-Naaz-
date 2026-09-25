'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import { Sparkles, MessageSquare, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ImprovementsCenterPage() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corrections');
      if (res.ok) {
        const data = await res.json();
        setCorrections(data.corrections || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans pb-28">
      <PillNavbar />
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                IMPROVEMENT CENTER
              </span>
              <span className="text-xs text-zinc-500">Calibration & Learned Preferences</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-amber-500" />
              What MENTRA Learned
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Review explainable operating rhythms, active user corrections, and recommendation feedback.
            </p>
          </div>

          <button
            onClick={fetchCorrections}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 transition-all text-zinc-300 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Supported Operating Rhythms */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              Supported Operating Rhythms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-1.5">
              <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Preferred Practice Window</span>
              <p className="text-sm font-semibold text-zinc-100">Evening (7:30 PM - 8:30 PM)</p>
              <p className="text-xs text-zinc-400">Confidence: High (Based on recent habit completions)</p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-1.5">
              <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Skill Coaching Focus</span>
              <p className="text-sm font-semibold text-zinc-100">Public Speaking: Strong Closing</p>
              <p className="text-xs text-zinc-400">Adapted from previous evaluation rubrics</p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-1.5">
              <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Primary Goal Context</span>
              <p className="text-sm font-semibold text-zinc-100">Direct Website Sales (₹1L Revenue)</p>
              <p className="text-xs text-zinc-400">Updated via explicit operator correction</p>
            </div>
          </div>
        </div>

        {/* Active User Corrections */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Active Operator Corrections
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {corrections.length} Applied
            </span>
          </div>

          <div className="pt-2">
            {corrections.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-400" />
                No active corrections logged yet. Tell MENTRA anytime if an assumption is outdated.
              </div>
            ) : (
              <div className="space-y-3">
                {corrections.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-500/30 text-amber-400 bg-amber-500/10">
                          {c.correctionType}
                        </span>
                        <span className="text-xs text-zinc-500">{c.targetEntityType}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 mt-1">New Value: {c.newValue}</p>
                      {c.oldValue && <p className="text-xs text-zinc-500 line-through">Previous: {c.oldValue}</p>}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
