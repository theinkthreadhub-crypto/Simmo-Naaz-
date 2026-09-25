'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string;
  objective: string;
  status: string;
  health: string;
  priority: string;
  targetDate?: string;
  financeBudget: number;
  financeSpent: number;
  nextAction?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newBudget, setNewBudget] = useState(0);
  const [newNextAction, setNewNextAction] = useState('');
  const [creating, setCreating] = useState(false);

  // Decision state
  const [decTitle, setDecTitle] = useState('');
  const [decRationale, setDecRationale] = useState('');
  const [recordingDec, setRecordingDec] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          objective: newObjective,
          financeBudget: newBudget,
          nextAction: newNextAction
        })
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProjects([data.project, ...projects]);
        setModalOpen(false);
        setNewTitle('');
        setNewObjective('');
        setNewNextAction('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim() || !decRationale.trim()) return;

    setRecordingDec(true);
    try {
      await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
          title: decTitle,
          rationale: decRationale
        })
      });
      setDecisionModalOpen(false);
      setDecTitle('');
      setDecRationale('');
    } catch (err) {
      console.error(err);
    } finally {
      setRecordingDec(false);
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
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Project Intelligence & Decisions
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Cross-domain intelligence binding active business campaigns, financial budgets, and strategic decision logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDecisionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs transition-all"
            >
              Log Decision
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            CONNECTING PROJECT INTELLIGENCE...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Projects</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Track multi-milestone strategic efforts (e.g. &ldquo;InkThread Summer Collection Launch&rdquo;).
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 backdrop-blur-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold uppercase">
                      {proj.health}
                    </span>
                    {proj.financeBudget > 0 && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ₹{proj.financeSpent} / ₹{proj.financeBudget} Spent
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {proj.objective}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>NEXT ACTION:</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    {proj.nextAction || 'Review active operational roadmap'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Create Strategic Project</h2>
              <p className="text-xs text-slate-400 mb-6">
                Bind operational goals, budget caps, and immediate next actions.
              </p>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Project Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. InkThread Brand Scaling"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Core Objective</label>
                  <textarea
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Describe target deliverable and success metrics..."
                    rows={3}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">Financial Budget (₹)</label>
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(parseFloat(e.target.value) || 0)}
                      min={0}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">Immediate Next Action</label>
                    <input
                      type="text"
                      value={newNextAction}
                      onChange={(e) => setNewNextAction(e.target.value)}
                      placeholder="e.g. Finalize 3 ad creatives"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Initialize Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Decision Modal */}
        {decisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Record Strategic Decision</h2>
              <p className="text-xs text-slate-400 mb-6">
                Log critical decisions, rationale, and expected outcomes into your sovereign knowledge graph.
              </p>

              <form onSubmit={handleRecordDecision} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Decision Summary</label>
                  <input
                    type="text"
                    value={decTitle}
                    onChange={(e) => setDecTitle(e.target.value)}
                    placeholder="e.g. Use Meta Ads over Google Ads for initial drop"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Rationale & Context</label>
                  <textarea
                    value={decRationale}
                    onChange={(e) => setDecRationale(e.target.value)}
                    placeholder="Why was this approach selected over alternatives?"
                    rows={3}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDecisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingDec}
                    className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-400 disabled:opacity-50"
                  >
                    {recordingDec ? 'Saving...' : 'Record Decision'}
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
