'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingSequence from '@/components/onboarding/OnboardingSequence';
import ConfigurationRequired from '@/components/system/ConfigurationRequired';
import { getPublicRuntimeConfig } from '@/lib/config/publicRuntime';

const MentraHQScene = dynamic(() => import('@/components/hq/MentraHQScene'), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();
  const pathname = usePathname();
  const runtimeConfig = getPublicRuntimeConfig();

  if (process.env.NODE_ENV === 'production' && !runtimeConfig.supabaseReady) {
    return <ConfigurationRequired missing={runtimeConfig.missing} />;
  }

  if (pathname === '/' || pathname === '/demo' || pathname === '/auth/reset-password') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#080907] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-[#d8ff63]/25 animate-spin-slow" />
          <div className="absolute w-8 h-8 rounded-full bg-[#d8ff63] animate-pulse shadow-[0_0_28px_rgba(216,255,99,0.45)]" />
        </div>
        <div className="text-xs font-mono tracking-widest text-[#d8ff63] uppercase animate-pulse">
          CALIBRATING MENTRA KERNEL...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!onboardingCompleted) {
    return <OnboardingSequence />;
  }

  if (pathname === '/hq') {
    return (
      <div className="fixed inset-0 overflow-hidden bg-[#C9BDB2] text-[#2F2B27]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#C9BDB2] text-[#2F2B27]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.30] blur-[1px]">
        <MentraHQScene />
      </div>
      <div className="fixed inset-0 z-[1] bg-[rgba(244,238,232,0.62)] backdrop-blur-[2px]" />
      <Link
        href="/hq"
        className="fixed left-3 top-3 z-30 flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-[11px] font-semibold text-[#3A342F] shadow-lg backdrop-blur-md transition hover:bg-white sm:left-5 sm:top-5"
      >
        <ArrowLeft className="h-4 w-4" />
        ROOM
      </Link>
      <main className="relative z-10 min-h-screen px-2 pb-4 pt-14 sm:px-4 sm:pb-6 sm:pt-16 lg:px-6">
        <div className="mx-auto min-h-[calc(100vh-4.5rem)] w-full max-w-[1500px] overflow-hidden rounded-[26px] border border-white/70 bg-white/[0.92] shadow-[0_30px_90px_rgba(84,62,45,0.22)] backdrop-blur-xl sm:rounded-[34px]">
          {children}
        </div>
      </main>
    </div>
  );
}
