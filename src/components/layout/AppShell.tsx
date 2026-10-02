'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import AuthScreen from '@/components/auth/AuthScreen';
import OnboardingSequence from '@/components/onboarding/OnboardingSequence';
import ConfigurationRequired from '@/components/system/ConfigurationRequired';
import { getPublicRuntimeConfig } from '@/lib/config/publicRuntime';

const MentraHQScene = dynamic(() => import('@/components/hq/MentraHQScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#072446]" />,
});

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();
  const pathname = usePathname();
  const runtimeConfig = getPublicRuntimeConfig();

  if (process.env.NODE_ENV === 'production' && !runtimeConfig.supabaseReady) {
    return <ConfigurationRequired missing={runtimeConfig.missing} />;
  }

  if (
    pathname === '/' ||
    pathname === '/demo' ||
    pathname === '/auth/reset-password'
  ) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-4 bg-[#072446]">
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 animate-spin-slow rounded-full border border-[#eda72d]/30" />
          <div className="absolute h-8 w-8 animate-pulse rounded-full bg-[#eda72d] shadow-[0_0_28px_rgba(237,167,45,0.45)]" />
        </div>
        <div className="animate-pulse font-mono text-xs uppercase tracking-widest text-[#eda72d]">
          ENTERING MENTRA HQ...
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

  const isRoom = pathname === '/hq';

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#072446] text-white">
      <div className="absolute inset-0 z-0">
        <MentraHQScene activePath={pathname} shellMode={!isRoom} />
      </div>

      {!isRoom && (
        <>
          <Link
            href="/hq"
            className="fixed left-3 top-3 z-50 inline-flex items-center gap-2 rounded-full border border-[#eda72d]/40 bg-[#0a3362]/95 px-3 py-2 text-[11px] font-black tracking-[0.08em] text-[#eda72d] shadow-[0_8px_24px_rgba(0,0,0,.35)] backdrop-blur-md transition hover:scale-[1.02] sm:left-4 sm:top-4"
          >
            <ArrowLeft className="h-4 w-4" />
            ROOM
          </Link>

          <div className="pointer-events-none absolute inset-0 z-20">
            <section className="pointer-events-auto absolute inset-x-2 bottom-2 h-[69dvh] overflow-hidden rounded-[26px] border border-white/15 bg-[#071421]/92 shadow-[0_30px_80px_rgba(0,0,0,.48)] backdrop-blur-xl sm:bottom-4 sm:left-auto sm:right-4 sm:top-20 sm:h-auto sm:w-[min(720px,52vw)] sm:rounded-[30px]">
              <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-white/10 bg-[#071421]/95 px-4 backdrop-blur-xl sm:h-16 sm:px-5">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-white/45">
                  <Box className="h-4 w-4 text-[#eda72d]" />
                  LIVE 3D MODULE
                </div>
              </header>

            <div className="h-[calc(100%-3.5rem)] overflow-y-auto overscroll-contain py-4 sm:h-[calc(100%-4rem)] sm:py-5">
              {children}
            </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
