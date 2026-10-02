'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth/AuthContext';

const MentraHQScene = dynamic(() => import('@/components/hq/MentraHQScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#060806]">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-[#d8ff63]/20 blur-xl" />
        <div className="mt-4 text-[10px] font-mono tracking-[0.24em] text-[#d8ff63]">ENTERING MENTRA HQ...</div>
      </div>
    </div>
  ),
});

export default function MentraHQPage() {
  const { profile, progress } = useAuth();
  const operatorName = profile?.display_name || 'Operator';
  const level = progress?.level ?? 1;
  const streak = progress?.current_streak ?? 0;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#060806] text-white">
      <MentraHQScene />

      <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-5 sm:top-5">
        <div className="rounded-2xl border border-white/10 bg-black/50 px-3.5 py-3 backdrop-blur-xl sm:px-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff63] shadow-[0_0_12px_rgba(216,255,99,.8)]" />
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#d8ff63]">MENTRA HQ</span>
          </div>
          <div className="mt-1.5 text-sm font-medium text-white/90">{operatorName}</div>
          <div className="mt-1 text-[9px] font-mono tracking-[0.12em] text-white/38">
            LEVEL {level} · {streak} DAY STREAK
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center sm:hidden">
        <div className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-[9px] font-mono tracking-[0.12em] text-white/48 backdrop-blur-xl">
          SWIPE ROOM · PINCH ZOOM · TAP OBJECTS
        </div>
      </div>
    </div>
  );
}
