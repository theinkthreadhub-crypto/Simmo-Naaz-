'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Unlock,
  Sliders,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { AutonomyMode } from '@/lib/safety/riskEngine';

interface AutonomySettingsState {
  mode: AutonomyMode;
  max_planning_steps: number;
  max_tool_calls: number;
  max_browser_actions: number;
  trusted_internal_actions: boolean;
}

export default function AutonomySettingsPage() {
  const [settings, setSettings] = useState<AutonomySettingsState>({
    mode: 'ASSISTED',
    max_planning_steps: 8,
    max_tool_calls: 12,
    max_browser_actions: 5,
    trusted_internal_actions: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/autonomy/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/autonomy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Sovereign autonomy matrix updated.' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to save settings.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Autonomy & Permission Matrix
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Govern sovereign AI execution boundaries, planning step limits, and approval checkpoints.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Matrix'}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-6">
          {/* Autonomy Level Mode Selector */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Sovereign Autonomy Mode
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Defines how independently MENTRA and its specialized agents can execute multi-step task plans.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  mode: 'MANUAL' as AutonomyMode,
                  title: 'MANUAL',
                  desc: 'MENTRA advises and prepares plans. Every single action requires explicit human approval.'
                },
                {
                  mode: 'ASSISTED' as AutonomyMode,
                  title: 'ASSISTED (Recommended)',
                  desc: 'Read-only queries and live research run autonomously. All data mutations require approval.'
                },
                {
                  mode: 'TRUSTED_INTERNAL' as AutonomyMode,
                  title: 'TRUSTED INTERNAL',
                  desc: 'Autonomous internal quests and journal logs allowed. External & financial actions mandate approval.'
                }
              ].map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setSettings({ ...settings, mode: item.mode })}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    settings.mode === item.mode
                      ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/15'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1.5">{item.title}</div>
                  <div className="text-xs leading-relaxed text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Execution Limits */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              Autonomous Bounded Limits
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Guardrails preventing runaway tool execution or excessive recursive agent loops.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="text-xs font-mono text-slate-300 block mb-2">Max Planning Steps</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={settings.max_planning_steps}
                  onChange={(e) =>
                    setSettings({ ...settings, max_planning_steps: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="text-xs font-mono text-slate-300 block mb-2">Max Tool Calls</label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={settings.max_tool_calls}
                  onChange={(e) =>
                    setSettings({ ...settings, max_tool_calls: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="text-xs font-mono text-slate-300 block mb-2">Max Browser Actions</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.max_browser_actions}
                  onChange={(e) =>
                    setSettings({ ...settings, max_browser_actions: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
