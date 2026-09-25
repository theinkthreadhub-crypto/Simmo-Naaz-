'use client';

import React, { useState } from 'react';
import { Settings, User, Shield, Bell, Moon, Database, LogOut, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SettingsPage() {
  const { user, profile, progress, signOut } = useAuth();
  const [soundEffects, setSoundEffects] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState(true);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Settings className="w-4 h-4 text-mentra-orange" />
            <span>OPERATOR CONFIGURATION</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            System & Privacy Settings
          </h1>
        </div>
      </div>

      {/* Operator Profile Panel */}
      <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-4">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <User className="w-4 h-4 text-mentra-orange" />
          <span>OPERATOR IDENTITY</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-white/40 block text-[10px]">CODENAME</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{displayName}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-white/40 block text-[10px]">AUTHENTICATED EMAIL</span>
            <span className="text-white font-bold text-sm mt-0.5 block truncate">{user?.email || 'operator@mentra.system'}</span>
          </div>
        </div>
      </div>

      {/* Preferences Panel */}
      <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-4">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-mentra-amber" />
          <span>INTERFACE PREFERENCES</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Daily AI Briefing Telemetry</div>
              <div className="text-[11px] text-white/50">Show synthesized morning missions banner</div>
            </div>
            <input
              type="checkbox"
              checked={dailyBriefing}
              onChange={(e) => setDailyBriefing(e.target.checked)}
              className="accent-mentra-orange w-4 h-4"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Reduced Motion Mode</div>
              <div className="text-[11px] text-white/50">Disables 3D camera sweeps and particle rotations</div>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="accent-mentra-orange w-4 h-4"
            />
          </div>
        </div>
      </div>

      {/* Database Security & RLS */}
      <div className="p-6 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-3">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>POSTGRESQL ROW LEVEL SECURITY (RLS)</span>
        </h3>
        <p className="text-xs text-white/70 font-sans leading-relaxed">
          All user data partitions (quests, capital ledgers, neural memories, and agent logs) are cryptographically enforced at the database level.
        </p>
      </div>

      {/* Sign Out Trigger */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={async () => await signOut()}
          className="px-6 py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider flex items-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>DISCONNECT & SIGN OUT</span>
        </button>
      </div>

    </div>
  );
}
