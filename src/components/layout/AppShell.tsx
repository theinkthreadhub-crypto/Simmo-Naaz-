'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import PillNavbar from '@/components/navigation/PillNavbar';
import MobileDock from '@/components/navigation/MobileDock';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingSequence from '@/components/onboarding/OnboardingSequence';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#090B0F] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-2xl border border-[#B7FF3C]/30 bg-[#161A22] flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B7FF3C] animate-pulse" />
          </div>
          <div className="font-display text-xl text-[#F5F7FA]">MENTRA</div>
          <div className="mt-2 text-xs font-mono uppercase tracking-[0.16em] text-[#697181]">
            Loading your system
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  if (!onboardingCompleted) return <OnboardingSequence />;

  return (
    <div className="min-h-screen bg-[#090B0F] text-[#F5F7FA] selection:bg-[#B7FF3C] selection:text-[#090B0F]">
      <PillNavbar />
      <MobileDock />
      <main className="min-h-screen pt-16 pb-24 lg:pt-20 lg:pb-10 lg:pl-[264px]">
        {children}
      </main>
    </div>
  );
}
