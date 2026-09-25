'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Bell,
  Clock,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  Moon,
  Zap,
  BookOpen,
  Calendar,
  Mail,
  DollarSign,
  Bot
} from 'lucide-react';

interface NotificationSettings {
  morning_brief_enabled: boolean;
  morning_brief_time: string;
  evening_reflection_enabled: boolean;
  evening_reflection_time: string;
  quest_alerts: boolean;
  goal_alerts: boolean;
  learning_reminders: boolean;
  finance_alerts: boolean;
  calendar_alerts: boolean;
  gmail_alerts: boolean;
  agent_updates: boolean;
  weekly_report: boolean;
  preferred_channel: 'WEB' | 'WHATSAPP' | 'EMAIL';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    morning_brief_enabled: true,
    morning_brief_time: '08:00',
    evening_reflection_enabled: true,
    evening_reflection_time: '21:00',
    quest_alerts: true,
    goal_alerts: true,
    learning_reminders: true,
    finance_alerts: true,
    calendar_alerts: true,
    gmail_alerts: false,
    agent_updates: true,
    weekly_report: true,
    preferred_channel: 'WHATSAPP',
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    timezone: 'Asia/Kolkata'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notifications/preferences');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Notification preferences synchronized.' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to save settings.' });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Network error while saving settings.' });
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
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Proactive Intelligence Settings
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Configure daily MENTRA brief schedules, Quiet Hours, and multichannel alerts.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
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

        {/* Form Content */}
        <div className="space-y-6">
          {/* Primary Channel Selection */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Primary Delivery Channel
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Choose where proactive briefs, reflections, and notifications should be dispatched.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['WHATSAPP', 'WEB', 'EMAIL'] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setSettings({ ...settings, preferred_channel: channel })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    settings.preferred_channel === channel
                      ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{channel}</div>
                  <div className="text-xs text-slate-400">
                    {channel === 'WHATSAPP' && 'Official 24/7 Meta Cloud API'}
                    {channel === 'WEB' && 'In-app notification tray'}
                    {channel === 'EMAIL' && 'Digest to verified address'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Cadence: Morning Brief & Evening Reflection */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Daily Cadence
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Automated briefing and reflection synthesized from your calendar, quests, and finance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Morning Brief */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Morning Brief</span>
                  <input
                    type="checkbox"
                    checked={settings.morning_brief_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, morning_brief_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Scheduled Time:</span>
                  <input
                    type="time"
                    value={settings.morning_brief_time}
                    onChange={(e) =>
                      setSettings({ ...settings, morning_brief_time: e.target.value })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Evening Reflection */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Evening Reflection</span>
                  <input
                    type="checkbox"
                    checked={settings.evening_reflection_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, evening_reflection_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Scheduled Time:</span>
                  <input
                    type="time"
                    value={settings.evening_reflection_time}
                    onChange={(e) =>
                      setSettings({ ...settings, evening_reflection_time: e.target.value })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              Quiet Hours
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Suppress routine proactive notifications during sleep or deep work. Critical security alerts will still deliver.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={settings.quiet_hours_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, quiet_hours_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                Enable Quiet Hours
              </label>

              {settings.quiet_hours_enabled && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>From</span>
                  <input
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) =>
                      setSettings({ ...settings, quiet_hours_start: e.target.value })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) =>
                      setSettings({ ...settings, quiet_hours_end: e.target.value })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-500">({settings.timezone})</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Toggles */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Notification Categories
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select which categories of autonomous intelligence alerts MENTRA is authorized to dispatch.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'quest_alerts', label: 'Quest & Mission Reminders', icon: Zap },
                { key: 'learning_reminders', label: 'Adaptive Skill & Speaking Nudges', icon: BookOpen },
                { key: 'finance_alerts', label: 'Budget & Expenditure Alerts', icon: DollarSign },
                { key: 'calendar_alerts', label: 'Upcoming Calendar Briefs', icon: Calendar },
                { key: 'gmail_alerts', label: 'Important Email Action Alerts', icon: Mail },
                { key: 'agent_updates', label: 'Background Agent Completion', icon: Bot },
              ].map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">{label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean((settings as unknown as Record<string, boolean>)[key])}
                    onChange={(e) =>
                      setSettings({ ...settings, [key]: e.target.checked } as unknown as NotificationSettings)
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
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
