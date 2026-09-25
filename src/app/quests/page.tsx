'use client';

import React, { useState } from 'react';
import { Sword, Plus, Filter, Sparkles, CheckCircle2, Shield, Zap, X, Trophy, MessageSquare } from 'lucide-react';
import QuestCard from '@/components/quests/QuestCard';
import { useMentraStore } from '@/lib/store/mentraStore';
import { Quest, QuestCategory, QuestDifficulty, QuestType, QUEST_REWARD_RULES } from '@/types/mentra';

export default function QuestsPage() {
  const { quests } = useMentraStore();
  const [filter, setFilter] = useState<'ALL' | 'DAILY' | 'MAIN' | 'BOSS' | 'COMPLETED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('BUSINESS');
  const [type, setType] = useState<QuestType>('DAILY');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('MEDIUM');
  const [requiredAction, setRequiredAction] = useState('');

  // Reflection modal state
  const [reflectionModalQuest, setReflectionModalQuest] = useState<{ id: string; title: string } | null>(null);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidYouLearn, setWhatDidYouLearn] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  const filteredQuests = quests.filter(q => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return q.status === 'COMPLETED';
    return q.type === filter && q.status !== 'COMPLETED';
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          difficulty,
          requiredAction: requiredAction.trim() || 'Execute protocol'
        })
      });

      const data = await res.json();
      if (data.success && data.quest) {
        useMentraStore.setState(prev => ({
          quests: [data.quest, ...prev.quests]
        }));
      } else {
        // Fallback
        const rewards = QUEST_REWARD_RULES[difficulty];
        const newQuest: Quest = {
          id: `q_${Date.now()}`,
          title,
          description,
          category,
          type,
          difficulty,
          rewardXp: rewards.xp,
          rewardCoins: rewards.coins,
          status: 'ACTIVE',
          progressPercent: 0,
          requiredAction: requiredAction || 'Execute protocol'
        };
        useMentraStore.setState(prev => ({
          quests: [newQuest, ...prev.quests]
        }));
      }

      setTitle('');
      setDescription('');
      setRequiredAction('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create quest:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatWentWell.trim() || !whatDidYouLearn.trim() || !reflectionModalQuest) return;

    setIsSavingReflection(true);
    try {
      await fetch('/api/reflections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'QUEST',
          sourceId: reflectionModalQuest.id,
          whatWentWell,
          whatDidYouLearn,
          convertToMemory: true
        })
      });

      setReflectionModalQuest(null);
      setWhatWentWell('');
      setWhatDidYouLearn('');
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const activeCount = quests.filter(q => q.status === 'ACTIVE').length;
  const completedCount = quests.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Sword className="w-4 h-4 text-mentra-orange" />
            <span>LIFE RPG CAMPAIGN MATRIX</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Missions & Quest Engine
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>INITIALIZE MISSION</span>
        </button>
      </div>

      {/* Stats Ribbon & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 glass-pill bg-black/60 border-white/10 overflow-x-auto scrollbar-none">
          {(['ALL', 'DAILY', 'MAIN', 'BOSS', 'COMPLETED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all flex-shrink-0 ${
                filter === tab
                  ? 'bg-gradient-to-r from-mentra-orange to-mentra-amber text-white shadow-[0_0_12px_rgba(255,74,0,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-white/60">
          <div>ACTIVE: <strong className="text-mentra-orange">{activeCount}</strong></div>
          <div>COMPLETED: <strong className="text-emerald-400">{completedCount}</strong></div>
        </div>
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredQuests.map(quest => (
          <QuestCard 
            key={quest.id} 
            quest={quest} 
            onPostReflection={(id, t) => setReflectionModalQuest({ id, title: t })}
          />
        ))}
      </div>

      {/* CREATE QUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-white/15 shadow-[0_0_50px_rgba(255,74,0,0.3)] space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase">
                <Sword className="w-4 h-4 text-mentra-orange" />
                <span>INITIALIZE MISSION PROTOCOL</span>
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
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  MISSION TITLE
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deploy ad creative scale test, Deliver 5-min speech"
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  TACTICAL DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific actions required to consider this mission fulfilled..."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as QuestCategory)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="BUSINESS">Business</option>
                    <option value="FINANCE">Finance</option>
                    <option value="LEARNING">Learning</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="FITNESS">Fitness</option>
                    <option value="PERSONAL_GROWTH">Personal Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">TYPE</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as QuestType)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="DAILY">Daily Quest</option>
                    <option value="MAIN">Main Campaign</option>
                    <option value="SIDE">Side Quest</option>
                    <option value="BOSS">Boss Mission</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">DIFFICULTY</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="EASY">Easy (+40 XP)</option>
                    <option value="MEDIUM">Medium (+80 XP)</option>
                    <option value="HARD">Hard (+150 XP)</option>
                    <option value="EPIC">Epic (+300 XP)</option>
                    <option value="BOSS">Boss (+500 XP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">ACTION PROMPT</label>
                  <input
                    type="text"
                    value={requiredAction}
                    onChange={(e) => setRequiredAction(e.target.value)}
                    placeholder="e.g. Verify ROAS threshold"
                    className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
              >
                {isSubmitting ? 'PERSISTING MISSION...' : 'AUTHORIZE & LAUNCH MISSION'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POST-MISSION REFLECTION MODAL */}
      {reflectionModalQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-mentra-orange/30 shadow-[0_0_50px_rgba(255,74,0,0.3)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase font-bold">
                <MessageSquare className="w-4 h-4 text-mentra-orange" />
                <span>POST-ACTION REFLECTION (+35 BONUS XP)</span>
              </div>
              <button 
                onClick={() => setReflectionModalQuest(null)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm font-semibold text-white">
              Mission: &quot;{reflectionModalQuest.title}&quot;
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">WHAT WENT WELL?</label>
                <textarea
                  rows={2}
                  required
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  placeholder="e.g. Executed without hesitation, kept steady vocal tone..."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">WHAT DID YOU LEARN FOR THE SECOND BRAIN?</label>
                <textarea
                  rows={2}
                  required
                  value={whatDidYouLearn}
                  onChange={(e) => setWhatDidYouLearn(e.target.value)}
                  placeholder="e.g. Structuring with PREP beforehand saves time and eliminates nervousness."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingReflection}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-mono text-xs font-bold hover:opacity-90 transition-all"
              >
                {isSavingReflection ? 'SAVING TO MEMORY VAULT...' : 'SAVE REFLECTION & CLAIM +35 XP'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
