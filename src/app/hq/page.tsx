'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MentraHQScene = dynamic(() => import('@/components/hq/MentraHQScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#072446]">
      <div className="text-center text-[#eda72d]">
        <div className="mx-auto h-20 w-20 animate-pulse rounded-full border-4 border-[#eda72d]" />
        <div className="mt-4 text-[11px] font-black tracking-[0.18em]">
          ENTERING MENTRA HQ...
        </div>
      </div>
    </div>
  ),
});

export default function MentraHQPage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#072446]">
      <MentraHQScene />
    </div>
  );
}
