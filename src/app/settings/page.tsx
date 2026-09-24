'use client';

import React from 'react';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import { Settings as SettingsIcon, Shield, Sliders, Key, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <SettingsIcon className="w-4 h-4" /> MENTRA SYSTEM PREFERENCES
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Operator Settings & Security</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage permission models, sandbox security, API rate limiting, and system appearance preferences.
            </p>
          </div>

          <CommandBar />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Configuration */}
            <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Operator Configuration
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Operator Codename</label>
                  <input
                    type="text"
                    defaultValue="MENTRA-SOV-01"
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Agent Autonomous Execution Policy</label>
                  <select
                    defaultValue="APPROVAL_REQUIRED"
                    className="w-full p-3 rounded-2xl bg-[#141824] border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="APPROVAL_REQUIRED">Human Approval Required for all External Actions (Recommended)</option>
                    <option value="SEMI_AUTONOMOUS">Semi-Autonomous (Low-risk auto-executed)</option>
                    <option value="FULL_AUTONOMOUS">Full Autonomous (Sandbox Only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-mono font-bold shadow-md shadow-cyan-500/20 hover:opacity-90 transition">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>

            {/* Security & API Keys */}
            <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-violet-400" /> Security & Secret Storage
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Supabase Project Endpoint</label>
                  <input
                    type="text"
                    defaultValue="https://mentra-os.supabase.co"
                    disabled
                    className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Row Level Security (RLS)</label>
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                    ✓ ACTIVE — All data strictly isolated to authenticated user UUID
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
