'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import QuestCard from '@/components/quests/QuestCard';
import { Target, Filter } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          {/* Header telemetry */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
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
              <div className="px-4 py-2 rounded-2xl bg-[#0d1017] border border-white/10 text-xs font-mono">
                <span className="text-slate-500 block text-[10px]">TOTAL COMPLETED</span>
                <span className="text-cyan-400 font-bold text-base">{player.totalQuestsCompleted}</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-[#0d1017] border border-white/10 text-xs font-mono">
                <span className="text-slate-500 block text-[10px]">CURRENT RANK</span>
                <span className="text-violet-400 font-bold text-base">{player.rank}</span>
              </div>
            </div>
          </div>

          <CommandBar />

          {/* Filter Rails */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-2">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> TYPE:
              </span>
              {['ALL', 'DAILY', 'MAIN', 'SIDE', 'BOSS'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`text-xs font-mono px-3.5 py-1 rounded-xl border transition ${
                    selectedType === type
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
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
                  className={`text-xs font-mono px-3.5 py-1 rounded-xl border transition ${
                    selectedCategory === cat
                      ? 'bg-violet-950 text-violet-300 border-violet-500/50'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
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
              <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
            ))}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
