'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Target,
  Award
} from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  description?: string;
  lifeArea: string;
  frequency: string;
  preferredTime?: string;
  difficulty: string;
  xpReward: number;
  completedToday?: boolean;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLifeArea, setNewLifeArea] = useState('Personal Growth');
  const [newTime, setNewTime] = useState('MORNING');
  const [newXp, setNewXp] = useState(15);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (data.success && data.habits) {
        setHabits(data.habits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (habitId: string) => {
    try {
      const res = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: data.message });
        setHabits(habits.map(h => h.id === habitId ? { ...h, completedToday: true } : h));
      } else {
        setToast({ type: 'error', message: data.message || 'Already completed.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to log completion.' });
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          lifeArea: newLifeArea,
          preferredTime: newTime,
          xpReward: newXp
        })
      });
      const data = await res.json();
      if (data.success && data.habit) {
        setHabits([data.habit, ...habits]);
        setModalOpen(false);
        setNewTitle('');
        setToast({ type: 'success', message: 'New sovereign habit established.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to create habit.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
<main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Sovereign Habit Rhythms
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Recurring daily behaviors and disciplined execution cycles that power your Life RPG progression.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Establish Habit</span>
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
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Habits Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            INITIALIZING HABIT CADENCE...
          </div>
        ) : habits.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
            <Flame className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Habits Established</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create foundational habits (e.g. &ldquo;20 min Public Speaking practice&rdquo; or &ldquo;Review Daily Finances&rdquo;).
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Establish First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                  habit.completedToday
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {habit.lifeArea}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      +{habit.xpReward} XP
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {habit.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{habit.preferredTime} CADENCE</span>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(habit.id)}
                  disabled={habit.completedToday}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    habit.completedToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{habit.completedToday ? 'DONE TODAY' : 'CHECK IN'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New Habit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Establish Sovereign Habit</h2>
              <p className="text-xs text-slate-400 mb-6">
                Habits repeat on schedule and award predictable XP towards your Life RPG rank.
              </p>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Habit Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 15m Public Speaking Voice Warmup"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">Life Area</label>
                    <select
                      value={newLifeArea}
                      onChange={(e) => setNewLifeArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Personal Growth">Personal Growth</option>
                      <option value="Business">Business</option>
                      <option value="Finance">Finance</option>
                      <option value="Learning">Learning</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">Preferred Time</label>
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="MORNING">Morning</option>
                      <option value="AFTERNOON">Afternoon</option>
                      <option value="EVENING">Evening</option>
                      <option value="ANYTIME">Anytime</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                  >
                    {creating ? 'Saving...' : 'Establish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
