'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Volume2,
  Mic,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Radio,
  Sliders
} from 'lucide-react';

interface VoiceSettingsState {
  tts_enabled: boolean;
  voice_id: string;
  speech_speed: number;
  language: string;
  auto_speak_responses: boolean;
  audio_retention_days: number;
}

export default function VoiceSettingsPage() {
  const [settings, setSettings] = useState<VoiceSettingsState>({
    tts_enabled: true,
    voice_id: 'echo',
    speech_speed: 1.0,
    language: 'hi-IN',
    auto_speak_responses: true,
    audio_retention_days: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/voice/settings');
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
      const res = await fetch('/api/voice/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Voice & speech settings updated.' });
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
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Voice & Audio Settings
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Configure MENTRA speech synthesis, native languages, and voice note retention policies.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
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
          {/* TTS Preferences */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Text-To-Speech Synthesis
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-white">Enable Voice Output</span>
                <input
                  type="checkbox"
                  checked={settings.tts_enabled}
                  onChange={(e) => setSettings({ ...settings, tts_enabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </label>

              <label className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-white">Auto-Speak Responses</span>
                <input
                  type="checkbox"
                  checked={settings.auto_speak_responses}
                  onChange={(e) => setSettings({ ...settings, auto_speak_responses: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">Voice Persona</label>
                <select
                  value={settings.voice_id}
                  onChange={(e) => setSettings({ ...settings, voice_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="echo">Echo (Neutral Sovereign)</option>
                  <option value="alloy">Alloy (Authoritative)</option>
                  <option value="fable">Fable (Narrative)</option>
                  <option value="onyx">Onyx (Deep Focus)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">Primary Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="hi-IN">Hindi / Hinglish (India)</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">Audio Retention (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.audio_retention_days}
                  onChange={(e) => setSettings({ ...settings, audio_retention_days: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
