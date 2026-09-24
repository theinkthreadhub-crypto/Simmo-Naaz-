'use client';

import React from 'react';
import { Quest } from '@/types/mentra';
import { CheckCircle2, Zap, Briefcase, BookOpen, Heart, TrendingUp, Sparkles } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
}

export default function QuestCard({ quest, onComplete }: QuestCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BUSINESS': return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      case 'FINANCE': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'LEARNING': return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'FITNESS': return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#0d1017]/90 border ${
        quest.status === 'COMPLETED'
          ? 'border-emerald-500/40 opacity-75'
          : quest.type === 'BOSS'
          ? 'border-rose-500/50 shadow-lg shadow-rose-500/10'
          : 'border-white/10 hover:border-cyan-500/40'
      } backdrop-blur-xl transition-all duration-300 flex flex-col justify-between`}
    >
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
            {getCategoryIcon(quest.category)}
            <span>{quest.category}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            +{quest.rewardXp} XP
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mb-1.5 leading-snug">
          {quest.title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
          {quest.description}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
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

      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          [{quest.type}]
        </span>

        {quest.status === 'COMPLETED' ? (
          <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        ) : (
          <button
            onClick={() => onComplete(quest.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium transition"
          >
            <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Complete
          </button>
        )}
      </div>
    </div>
  );
}
