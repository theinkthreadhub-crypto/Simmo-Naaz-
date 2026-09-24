'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { QuestCategory } from '@/types/mentra';
import {
  Target,
  CheckCircle2,
  Zap,
  Filter,
  Briefcase,
  BookOpen,
  Heart,
  TrendingUp,
  Sparkles
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
      case 'BUSINESS': return <Briefcase className="w-4 h-4 text-[#ff8a1f]" />;
      case 'FINANCE': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'LEARNING': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'FITNESS': return <Heart className="w-4 h-4 text-rose-400" />;
      default: return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">EASY</span>;
      case 'MEDIUM': return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff3d00]/20 text-[#ff8a1f] border border-[#ff3d00]/30">MEDIUM</span>;
      case 'HARD': return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">HARD</span>;
      case 'EPIC': return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 font-bold">EPIC BOSS</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Target className="w-4 h-4" /> MENTRA LIFE RPG SYSTEM
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Active Quest Matrix</h1>
            <p className="text-white/60 text-sm mt-1">
              Transform daily operations into quantified character progression. Earn verified XP and level attributes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-[rgba(56,20,6,0.5)] border border-white/10 text-xs font-mono">
              <span className="text-white/40 block text-[10px]">TOTAL COMPLETED</span>
              <span className="text-[#ff8a1f] font-bold text-base">{player.totalQuestsCompleted}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-[rgba(56,20,6,0.5)] border border-white/10 text-xs font-mono">
              <span className="text-white/40 block text-[10px]">CURRENT RANK</span>
              <span className="text-amber-300 font-bold text-base">{player.rank}</span>
            </div>
          </div>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Filter Rails */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[rgba(56,20,6,0.4)] border border-white/15 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-white/50 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5 text-[#ff8a1f]" /> TYPE:
            </span>
            {['ALL', 'DAILY', 'MAIN', 'SIDE', 'BOSS'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`text-xs font-mono px-3.5 py-1 rounded-full border transition ${
                  selectedType === type
                    ? 'bg-[#ff3d00]/30 text-[#ff8a1f] border-[#ff8a1f]/60 shadow-lg shadow-orange-950/50'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-white/50 mr-2">CATEGORY:</span>
            {['ALL', 'BUSINESS', 'FINANCE', 'LEARNING', 'FITNESS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-mono px-3.5 py-1 rounded-full border transition ${
                  selectedCategory === cat
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
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
              className={`p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border ${
                quest.status === 'COMPLETED'
                  ? 'border-emerald-500/40 opacity-75'
                  : quest.type === 'BOSS'
                  ? 'border-rose-500/50 shadow-2xl shadow-rose-950/40'
                  : 'border-white/15 hover:border-[#ff8a1f]/50'
              } backdrop-blur-xl transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-white/70">
                    {getCategoryIcon(quest.category)}
                    <span>{quest.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(quest.difficulty)}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                      {quest.type}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {quest.title}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                  {quest.description}
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-mono text-white/50 mb-1">
                    <span>PROGRESS</span>
                    <span className="text-[#ff8a1f]">{quest.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a1f]"
                      style={{ width: `${quest.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#ff8a1f] font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>+{quest.rewardXp} XP</span>
                  {quest.rewardCoins > 0 && (
                    <span className="text-amber-300">+{quest.rewardCoins} CR</span>
                  )}
                </div>

                {quest.status === 'COMPLETED' ? (
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> COMPLETED
                  </span>
                ) : (
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="btn btn--flame !py-1.5 !px-3.5 text-xs"
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
