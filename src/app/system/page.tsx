'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck
} from 'lucide-react';

type HealthLevel =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'CRITICAL'
  | 'UNKNOWN'
  | 'DISABLED';

interface HealthComponent {
  key: string;
  name: string;
  level: HealthLevel;
  message: string;
  metrics?: Record<string, number | string | boolean | null>;
}

interface HealthSnapshot {
  status: HealthLevel;
  timestamp: string;
  autoRecoveryEnabled: boolean;
  components: HealthComponent[];
}

function badgeClass(level: HealthLevel): string {
  if (level === 'HEALTHY') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  if (level === 'DEGRADED') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (level === 'CRITICAL') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }
  return 'border-zinc-700 bg-zinc-800/60 text-zinc-400';
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const loadHealth = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/system/health', {
        cache: 'no-store'
      });

      if (response.ok) {
        setHealth(await response.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const timer = window.setInterval(loadHealth, 30000);
    return () => window.clearInterval(timer);
  }, [loadHealth]);

  const runRecovery = async () => {
    setRecovering(true);
    setRecoveryMessage('');

    try {
      const response = await fetch('/api/system/recovery', {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        setRecoveryMessage(data.error || 'Recovery failed.');
      } else {
        const summary = data.summary;
        setRecoveryMessage(
          `Recovered ${summary.recovered}; failed ${summary.failed}; checked ${summary.actions.length} item(s).`
        );
        await loadHealth();
      }
    } catch {
      setRecoveryMessage('Recovery request failed.');
    } finally {
      setRecovering(false);
    }
  };

  const overall = health?.status || 'UNKNOWN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-28">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Cpu className="w-4 h-4 text-mentra-orange" />
            MENTRA LIVE SYSTEM HEALTH
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-2">
            Diagnostics & Recovery Center
          </h1>
          <p className="text-sm text-white/50 mt-2 max-w-2xl">
            Live runtime, scheduler, approval, persistent-agent and worker telemetry. No hard-coded green status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadHealth}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={runRecovery}
            disabled={recovering}
            className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200 flex items-center gap-2 hover:bg-amber-500/15 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${recovering ? 'animate-spin' : ''}`} />
            Run Safe Recovery
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
          <div className="text-[11px] font-mono text-white/40 uppercase">
            Overall Kernel
          </div>
          <div className="flex items-center gap-3 mt-3">
            {overall === 'HEALTHY' ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            )}
            <span className={`px-3 py-1 rounded-full border text-xs font-mono ${badgeClass(overall)}`}>
              {overall}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
          <div className="text-[11px] font-mono text-white/40 uppercase">
            Auto Recovery
          </div>
          <div className="flex items-center gap-3 mt-3">
            <ShieldCheck className="w-7 h-7 text-mentra-orange" />
            <span className="text-sm font-semibold text-white">
              {health?.autoRecoveryEnabled ? 'Enabled' : 'Manual / Safe Mode'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
          <div className="text-[11px] font-mono text-white/40 uppercase">
            Last Telemetry
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Activity className="w-7 h-7 text-mentra-amber" />
            <span className="text-sm font-semibold text-white">
              {health?.timestamp
                ? new Date(health.timestamp).toLocaleTimeString()
                : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {recoveryMessage && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          {recoveryMessage}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(health?.components || []).map(component => (
          <div
            key={component.key}
            className="rounded-2xl border border-white/10 bg-black/60 p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-mentra-orange" />
                <h2 className="font-semibold text-white text-sm">
                  {component.name}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono ${badgeClass(component.level)}`}>
                {component.level}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-white/55">
              {component.message}
            </p>

            {component.metrics && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.entries(component.metrics).slice(0, 6).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-white/5 bg-white/[0.03] p-2"
                  >
                    <div className="text-[9px] uppercase text-white/30 truncate">
                      {key}
                    </div>
                    <div className="text-xs text-white/80 mt-1 truncate">
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {!health && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200">
            Health telemetry could not be loaded.
          </div>
        )}
      </div>
    </div>
  );
}
