'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import LeadAgentConsole from '@/components/agents/lead/LeadAgentConsole';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-full bg-mentra-orange/10 motion-safe:animate-pulse" />
});

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-6 border-b border-mentra-hairline pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Agents</h1>
          <p className="mt-3 text-sm leading-relaxed text-mentra-text-secondary sm:text-base">
            Give MENTRA a goal. It makes a plan, hands each part to the right specialist, runs independent parts
            at the same time, and stops to ask you before sending, paying or deleting anything.
          </p>
        </div>
        <div className="hidden h-28 w-28 shrink-0 md:block lg:h-36 lg:w-36" aria-hidden>
          <MentraCore3D className="h-full w-full" />
        </div>
      </header>

      <LeadAgentConsole />
    </div>
  );
}
