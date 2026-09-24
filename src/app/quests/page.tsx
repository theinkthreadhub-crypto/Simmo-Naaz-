'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { QuestCategory, QuestType } from '@/types/mentra';
import {
  Target,
  CheckCircle2,
  Zap,
  Shield,
  Award,
  Filter,
  Sparkles,
  Flame,
  Skull,
  Briefcase,
  BookOpen,
  Heart,
  TrendingUp
} from 'lucide-react';

export default function QuestsPage() {
  const quests = useMentraStore((state) => state.quests);
  const player = useMentraStore((state) => state.player);
  const completeQuest = useMentraStore((state) => state.completeQuest);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredQuests = quests.filter((q) => {
    if (selectedType !== 'ALL' && q.type !== selectedType) return false;
    if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;
    return true;
  });

  const getCategoryIcon = (category: QuestCategory) => {
    switch (category) {
      case 'BUSINESS': return <Briefcase className="w-4 h-4 text-cyan-400" />;
      case 'FINANCE': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'LEARNING': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'FITNESS': return <Heart className="w-4 h-4 text-rose-400" />;
      default: return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">EASY</span>;
      case 'MEDIUM': return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">MEDIUM</span>;
      case 'HARD': return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">HARD</span>;
      case 'EPIC': return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/30 font-bold">EPIC BOSS</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Target className="w-4 h-4" /> MENTRA LIFE RPG SYSTEM
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Quest Matrix</h1>
            <p className="text-slate-400 text-sm mt-1">
              Transform daily operations into quantified character progression. Earn verified XP and level attributes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">TOTAL COMPLETED</span>
              <span className="text-cyan-400 font-bold text-base">{player.totalQuestsCompleted}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">CURRENT RANK</span>
              <span className="text-violet-400 font-bold text-base">{player.rank}</span>
            </div>
          </div>
        </div>

        {/* Persistent Command Bar */}
        <CommandBar />

        {/* Filter Rails */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0d101a] border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> TYPE:
            </span>
            {['ALL', 'DAILY', 'MAIN', 'SIDE', 'BOSS'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition ${
                  selectedType === type
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-2">CATEGORY:</span>
            {['ALL', 'BUSINESS', 'FINANCE', 'LEARNING', 'FITNESS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition ${
                  selectedCategory === cat
                    ? 'bg-violet-950 text-violet-300 border-violet-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-5 rounded-2xl bg-[#0d101a]/90 border ${
                quest.status === 'COMPLETED'
                  ? 'border-emerald-500/30 opacity-75'
                  : quest.type === 'BOSS'
                  ? 'border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'border-slate-800/90 hover:border-cyan-500/40'
              } transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                    {getCategoryIcon(quest.category)}
                    <span>{quest.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(quest.difficulty)}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {quest.type}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {quest.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {quest.description}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>PROGRESS</span>
                    <span className="text-cyan-400">{quest.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${quest.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer action & rewards */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>+{quest.rewardXp} XP</span>
                  {quest.rewardCoins > 0 && (
                    <span className="text-amber-400">+{quest.rewardCoins} CR</span>
                  )}
                </div>

                {quest.status === 'COMPLETED' ? (
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> COMPLETED
                  </span>
                ) : (
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-semibold shadow-md shadow-cyan-500/20 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Quest
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
