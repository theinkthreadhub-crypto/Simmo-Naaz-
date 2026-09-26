'use client';

import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Trophy, Calendar, Sparkles, X, ChevronRight } from 'lucide-react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { Goal } from '@/types/mentra';

export default function GoalsPage() {
  const { goals } = useMentraStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'BUSINESS' | 'FINANCE' | 'LEARNING' | 'FITNESS' | 'COMMUNICATION'>('BUSINESS');
  const [targetDate, setTargetDate] = useState('2026-12-31');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/goals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          target_date: targetDate
        })
      });

      const data = await res.json();
      if (data.success && data.goal) {
        useMentraStore.setState(prev => ({
          goals: [data.goal, ...prev.goals]
        }));
      } else {
        // Fallback
        const newGoal: Goal = {
          id: `g_${Date.now()}`,
          title,
          description,
          category,
          targetDate,
          progressPercent: 0,
          status: 'IN_PROGRESS',
          milestones: [
            { id: `m_${Date.now()}_1`, title: 'Foundation Launch', targetValue: 100, currentValue: 0, unit: '%', completed: false, rewardXp: 75 },
            { id: `m_${Date.now()}_2`, title: 'Target Milestone Complete', targetValue: 100, currentValue: 0, unit: '%', completed: false, rewardXp: 150 }
          ]
        };
        useMentraStore.setState(prev => ({
          goals: [newGoal, ...prev.goals]
        }));
      }

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    useMentraStore.setState(prev => {
      const updatedGoals = prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map(m => 
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progressPercent = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
        return {
          ...g,
          milestones: updatedMilestones,
          progressPercent
        };
      });
      return { goals: updatedGoals };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Target className="w-4 h-4 text-mentra-orange" />
            <span>MACRO HORIZON & MILESTONES</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Sovereign Goals Engine
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider shadow-[0_0_20px_rgba(91,108,255,0.4)] hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ESTABLISH MACRO GOAL</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="space-y-6">
        {goals.map(goal => (
          <div 
            key={goal.id} 
            className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 relative overflow-hidden space-y-6"
          >
            {/* Goal Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-mentra-amber uppercase px-2.5 py-0.5 rounded-full bg-mentra-orange/15 border border-mentra-orange/30">
                    {goal.category}
                  </span>
                  <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/30" />
                    <span>TARGET: {goal.target_date || goal.targetDate || '2026-12-31'}</span>
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                  {goal.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 font-sans max-w-2xl leading-relaxed">
                  {goal.description}
                </p>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="text-right font-mono">
                  <div className="text-2xl font-extrabold text-mentra-amber">{goal.progressPercent}%</div>
                  <div className="text-[10px] text-white/40">COMPLETION</div>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-mentra-orange to-mentra-amber rounded-full transition-all duration-500" 
                style={{ width: `${goal.progressPercent}%` }}
              />
            </div>

            {/* Milestones / Sub-missions */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-mono text-white/40 uppercase">TACTICAL MILESTONES</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goal.milestones?.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMilestone(goal.id, m.id)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        m.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30'
                      }`}>
                        {m.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs font-mono ${m.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                        {m.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-mentra-amber">+{m.rewardXp} XP</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-white/15 shadow-[0_0_50px_rgba(91,108,255,0.3)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase">
                <Target className="w-4 h-4 text-mentra-orange" />
                <span>ESTABLISH STRATEGIC MACRO GOAL</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">GOAL TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build business to ₹1,00,000 monthly revenue"
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">STRATEGIC CONTEXT</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target unit economics, key deliverables, and constraints..."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="BUSINESS">Business</option>
                    <option value="FINANCE">Finance</option>
                    <option value="LEARNING">Learning</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="FITNESS">Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">DEADLINE</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(91,108,255,0.4)] hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
              >
                {isSubmitting ? 'PERSISTING GOAL...' : 'ESTABLISH GOAL & MILESTONES'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
