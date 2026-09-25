'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Target,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  objective: string;
  timelineDays: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  totalXp: number;
  milestones: Array<{ id: string; title: string; completed: boolean; xpReward: number }>;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newDays, setNewDays] = useState(7);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/missions');
      const data = await res.json();
      if (data.success && data.missions) {
        setMissions(data.missions);
      }
    } catch (e) {
      console.error('Failed to load missions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, objective: newObjective, timelineDays: newDays })
      });
      const data = await res.json();
      if (data.success && data.mission) {
        setMissions([data.mission, ...missions]);
        setModalOpen(false);
        setNewTitle('');
        setNewObjective('');
      }
    } catch (err) {
      console.error('Creation failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-mentra-orange to-mentra-amber flex items-center justify-center text-white shadow-lg shadow-mentra-orange/20">
                <Target className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Sovereign Mission Control
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Autonomous multi-agent task execution graphs, milestone roadmaps, and high-impact life campaigns.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-mentra-orange/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Mission</span>
          </button>
        </div>

        {/* Missions Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            INITIALIZING MISSION GRAPHS...
          </div>
        ) : missions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
            <Target className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Campaigns</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Command MENTRA with a major life or business objective (e.g. &ldquo;Launch new InkThread drop in 7 days&rdquo;).
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Create First Mission
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missions.map((m) => {
              const completedCount = m.milestones.filter((mil) => mil.completed).length;
              const progressPct = m.milestones.length > 0 ? Math.round((completedCount / m.milestones.length) * 100) : 0;

              return (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-mentra-orange/40 backdrop-blur-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-mentra-orange/15 text-mentra-amber border border-mentra-orange/30">
                        {m.timelineDays} DAY CAMPAIGN
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        +{m.totalXp} XP REWARD
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-mentra-amber transition-colors mb-2">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {m.objective}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span>Milestones: {completedCount}/{m.milestones.length}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-mentra-orange to-mentra-amber h-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* New Mission Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Initiate Sovereign Mission</h2>
              <p className="text-xs text-slate-400 mb-6">
                MENTRA Planner will construct a multi-agent DAG task graph with research, budget audits, and daily quests.
              </p>

              <form onSubmit={handleCreateMission} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. InkThread Summer Drop Launch"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-mentra-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">High-Level Objective</label>
                  <textarea
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Describe what you want to achieve..."
                    rows={3}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-mentra-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Target Timeline (Days)</label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={(e) => setNewDays(parseInt(e.target.value, 10))}
                    min={1}
                    max={90}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-mentra-orange"
                  />
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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                  >
                    {creating ? 'Synthesizing DAG...' : 'Launch Mission'}
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
