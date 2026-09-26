'use client';

import React, { useEffect, useState } from 'react';
import { Flame, Shield, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function SystemStatus() {
  const { user, profile, progress } = useAuth();
  const { quests, player } = useMentraStore();
  const [kernelStatus, setKernelStatus] = useState('CHECKING');

  useEffect(() => {
    let active = true;

    fetch('/api/system/health', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (active && data?.status) setKernelStatus(data.status);
      })
      .catch(() => {
        if (active) setKernelStatus('UNKNOWN');
      });

    return () => {
      active = false;
    };
  }, []);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const displayLevel = progress?.level ?? player.level;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="w-full glass-panel-strong p-4 sm:p-5 border-white/10 bg-black/60 relative overflow-hidden">
      {/* Subtle ambient beam */}
      <div className="absolute top-0 right-1/4 w-48 h-12 bg-mentra-orange/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Greeting & Telemetry Message */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-mentra-amber">
              MENTRA ONLINE // LIVE TELEMETRY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <span>{getGreeting()}, {displayName}</span>
          </h2>
          <p className="text-xs text-white/70 max-w-xl font-sans">
            Today you have {activeQuests.length > 0 ? `${activeQuests.length} active missions` : 'no pending missions'}, 1 finance checkpoint and 20 minutes of autonomous skill progression ready.
          </p>
        </div>

        {/* Right Status Metrics */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-mentra-orange" />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">LEVEL</div>
              <div className="text-xs font-mono font-bold text-white">0{displayLevel}</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-mentra-amber" />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">STREAK</div>
              <div className="text-xs font-mono font-bold text-white">{displayStreak} Days</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">KERNEL</div>
              <div className={`text-xs font-mono font-bold ${kernelStatus === 'HEALTHY' ? 'text-emerald-300' : 'text-cyan-300'}`}>
                {kernelStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
