'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import PillNavbar from '@/components/navigation/PillNavbar';
import MobileDock from '@/components/navigation/MobileDock';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingSequence from '@/components/onboarding/OnboardingSequence';
import ConfigurationRequired from '@/components/system/ConfigurationRequired';
import { getPublicRuntimeConfig } from '@/lib/config/publicRuntime';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();
  const pathname = usePathname();
  const runtimeConfig = getPublicRuntimeConfig();

  if (process.env.NODE_ENV === 'production' && !runtimeConfig.supabaseReady) {
    return <ConfigurationRequired missing={runtimeConfig.missing} />;
  }

  if (pathname === '/demo' || pathname === '/auth/reset-password') {
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

  return (
    <div className="min-h-screen bg-[#080907] text-[#f4f1e8] flex flex-col relative selection:bg-[#d8ff63] selection:text-[#080907]">
      <PillNavbar />
      <MobileDock />
      <main className="flex-1 w-full pt-20 lg:pt-28 pb-24 lg:pb-12">
        {children}
      </main>
    </div>
  );
}
