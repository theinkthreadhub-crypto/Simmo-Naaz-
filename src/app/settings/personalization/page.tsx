'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Brain,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sliders,
  Sparkles,
  Lock
} from 'lucide-react';

interface PersonalizationSettingsState {
  level: 'MINIMAL' | 'STANDARD' | 'DEEP';
  use_calendar_patterns: boolean;
  use_learning_patterns: boolean;
  use_finance_context: boolean;
  use_wellness_context: boolean;
  auto_memory_candidates: boolean;
  recommendation_frequency: 'LOW' | 'NORMAL' | 'HIGH';
}

export default function PersonalizationSettingsPage() {
  const [settings, setSettings] = useState<PersonalizationSettingsState>({
    level: 'STANDARD',
    use_calendar_patterns: true,
    use_learning_patterns: true,
    use_finance_context: true,
    use_wellness_context: false,
    auto_memory_candidates: true,
    recommendation_frequency: 'NORMAL'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/personalization/settings');
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
      const res = await fetch('/api/personalization/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Personalization & privacy boundaries updated.' });
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Personalization & Privacy Scopes
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Govern how MENTRA learns your operating rhythm, pattern detection scopes, and recommendation triggers.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Scopes'}
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

        <div className="space-y-6">
          {/* Personalization Level */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Personalization Depth
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Controls the historical telemetry window used when generating autonomous daily plans and recommendations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  level: 'MINIMAL' as const,
                  title: 'MINIMAL',
                  desc: 'Uses only direct current chat context. No behavioral pattern inference.'
                },
                {
                  level: 'STANDARD' as const,
                  title: 'STANDARD (Recommended)',
                  desc: 'Synthesizes active goals, recent quests, and explicit memory records.'
                },
                {
                  level: 'DEEP' as const,
                  title: 'DEEP',
                  desc: 'Analyzes long-term operating rhythms and task duration trends.'
                }
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setSettings({ ...settings, level: item.level })}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    settings.level === item.level
                      ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg shadow-purple-500/15'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1.5">{item.title}</div>
                  <div className="text-xs leading-relaxed text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Context Scopes Matrix */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Authorized Context Scopes
            </h2>
            <p className="text-xs text-slate-400 mb-2">
              Explicitly allow or deny MENTRA access to specific telemetry domains during autonomous planning.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'use_calendar_patterns', label: 'Google Calendar Availability & Focus Slots' },
                { key: 'use_learning_patterns', label: 'Adaptive Speech & Skill Progression Telemetry' },
                { key: 'use_finance_context', label: 'Budget Allocations & Expense Balances' },
                { key: 'use_wellness_context', label: 'Sleep & Energy Self-Ratings (Sensitive)' },
                { key: 'auto_memory_candidates', label: 'Auto-Consolidate Factual Memories from Chat' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-200">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((settings as unknown as Record<string, boolean>)[key])}
                    onChange={(e) =>
                      setSettings({ ...settings, [key]: e.target.checked } as unknown as PersonalizationSettingsState)
                    }
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
