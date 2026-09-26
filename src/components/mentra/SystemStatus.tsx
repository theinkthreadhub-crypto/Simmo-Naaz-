'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

type CapabilityStatus = 'CONNECTED' | 'CONFIG_REQUIRED' | 'DEGRADED' | 'DISABLED' | 'CODE_READY';

interface HealthResponse {
  status?: string;
  capabilities?: Record<string, { status?: CapabilityStatus; description?: string }>;
}

export default function SystemStatus() {
  const { user, profile, progress } = useAuth();
  const { quests, player } = useMentraStore();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/system/health', { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (active) setHealth(data);
      })
      .catch(() => {
        if (active) setHealth({ status: 'UNKNOWN' });
      });
    return () => { active = false; };
  }, []);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const displayLevel = progress?.level ?? player.level;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator';

  const aiStatus = health?.capabilities?.ai_core?.status || 'DEGRADED';
  const kernelStatus = health?.status || 'CHECKING';
  const aiConnected = aiStatus === 'CONNECTED' || aiStatus === 'CODE_READY';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="w-full glass-panel-strong p-4 sm:p-5 border-white/10 bg-black/60 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-48 h-12 bg-mentra-orange/15 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${aiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono uppercase tracking-widest text-mentra-amber">
              {aiConnected ? 'REAL AI CONNECTED' : 'AI SETUP REQUIRED'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            {greeting}, {displayName}
          </h2>
          <p className="text-xs text-white/70 max-w-xl font-sans">
            {activeQuests.length > 0
              ? `${activeQuests.length} verified active mission${activeQuests.length === 1 ? '' : 's'} in your database.`
              : 'No active missions are currently stored.'}
            {' '}
            AI status: {aiStatus}.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto flex-wrap">
          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-mentra-orange" />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">LEVEL</div>
              <div className="text-xs font-mono font-bold text-white">{displayLevel}</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Flame className="w-4 h-4 text-mentra-amber" />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">STREAK</div>
              <div className="text-xs font-mono font-bold text-white">{displayStreak} Days</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Activity className={`w-4 h-4 ${kernelStatus === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-300'}`} />
            <div>
              <div className="text-[10px] uppercase font-mono text-white/40">SYSTEM</div>
              <div className={`text-xs font-mono font-bold ${kernelStatus === 'HEALTHY' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {kernelStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
