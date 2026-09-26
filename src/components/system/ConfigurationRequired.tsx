'use client';

import React from 'react';
import { AlertTriangle, Database, Activity, ShieldCheck } from 'lucide-react';

export default function ConfigurationRequired({
  missing
}: {
  missing: string[];
}) {
  return (
    <div className="min-h-screen w-full bg-energy-horizon flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-400/30 bg-black/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-[0.22em] text-amber-300">
              Production Core Setup Required
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              MENTRA code is online, but its database connection is not configured.
            </h1>
            <p className="text-sm text-white/65 leading-relaxed">
              Authentication and persistent memory are intentionally blocked until the
              dedicated MENTRA Supabase project is connected. No demo or fallback database
              is used in production.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-7">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Database className="w-4 h-4 text-mentra-orange mb-2" />
            <div className="text-xs font-mono text-white/40 uppercase">Database</div>
            <div className="text-sm font-semibold text-amber-200 mt-1">Not connected</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
            <div className="text-xs font-mono text-white/40 uppercase">Fail-closed</div>
            <div className="text-sm font-semibold text-emerald-300 mt-1">Active</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Activity className="w-4 h-4 text-sky-400 mb-2" />
            <div className="text-xs font-mono text-white/40 uppercase">Health API</div>
            <a
              href="/api/system/health"
              className="text-sm font-semibold text-sky-300 hover:text-white mt-1 inline-block"
            >
              Open status
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[11px] font-mono uppercase text-white/40 mb-2">
            Missing core configuration
          </div>
          <div className="space-y-1">
            {missing.map(item => (
              <div key={item} className="text-xs font-mono text-white/75">
                • {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
