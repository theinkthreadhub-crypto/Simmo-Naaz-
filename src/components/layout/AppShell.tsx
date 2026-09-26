'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import PillNavbar from '@/components/navigation/PillNavbar';
import MobileDock from '@/components/navigation/MobileDock';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingSequence from '@/components/onboarding/OnboardingSequence';
import ConfigurationRequired from '@/components/system/ConfigurationRequired';
import { getPublicRuntimeConfig } from '@/lib/config/publicRuntime';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();
  const runtimeConfig = getPublicRuntimeConfig();

  if (process.env.NODE_ENV === 'production' && !runtimeConfig.supabaseReady) {
    return <ConfigurationRequired missing={runtimeConfig.missing} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-energy-horizon flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-mentra-orange/30 animate-spin-slow" />
          <div className="absolute w-8 h-8 rounded-full bg-mentra-orange animate-pulse shadow-[0_0_20px_#ff4a00]" />
        </div>
        <div className="text-xs font-mono tracking-widest text-mentra-amber uppercase animate-pulse">
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
    <div className="min-h-screen bg-energy-horizon text-white flex flex-col relative selection:bg-mentra-orange selection:text-white">
      <PillNavbar />
      <MobileDock />
      <main className="flex-1 w-full pt-20 lg:pt-28 pb-24 lg:pb-12">
        {children}
      </main>
    </div>
  );
}
