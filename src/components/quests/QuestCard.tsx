'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  DollarSign, 
  GraduationCap, 
  Dumbbell, 
  Heart, 
  Sparkles,
  Zap,
  Target,
  MessageSquare,
  ShieldCheck,
  X
} from 'lucide-react';
import { Quest } from '@/types/mentra';
import { useMentraStore } from '@/lib/store/mentraStore';

interface QuestCardProps {
  quest: Quest;
  onComplete?: () => void;
  onPostReflection?: (questId: string, questTitle: string) => void;
}

export default function QuestCard({ quest, onComplete, onPostReflection }: QuestCardProps) {
  const { completeQuest, addXp } = useMentraStore();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleClaim = async () => {
    setIsCompleting(true);
    try {
      const res = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: quest.id })
      });
      const data = await res.json();
      if (data.success) {
        completeQuest(quest.id);
        if (onPostReflection && (quest.type === 'MAIN' || quest.type === 'BOSS' || quest.difficulty === 'HARD' || quest.difficulty === 'EPIC')) {
          onPostReflection(quest.id, quest.title);
        }
      } else {
        // Fallback for demo mode
        completeQuest(quest.id);
      }
    } catch (err) {
      console.warn('API completion fallback:', err);
      completeQuest(quest.id);
    } finally {
      setIsCompleting(false);
      if (onComplete) onComplete();
    }
  };

  const getCategoryIcon = () => {
    switch (quest.category) {
      case 'BUSINESS':
        return <Briefcase className="w-4 h-4 text-mentra-orange" />;
      case 'FINANCE':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'LEARNING':
        return <GraduationCap className="w-4 h-4 text-mentra-amber" />;
      case 'FITNESS':
        return <Dumbbell className="w-4 h-4 text-rose-400" />;
      case 'COMMUNICATION':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Heart className="w-4 h-4 text-amber-300" />;
    }
  };

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'EASY':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'MEDIUM':
        return 'text-mentra-amber border-mentra-amber/30 bg-mentra-amber/10';
      case 'HARD':
        return 'text-mentra-orange border-mentra-orange/30 bg-mentra-orange/10';
      case 'EPIC':
      case 'ELITE':
        return 'text-amber-300 border-amber-400/40 bg-amber-400/15';
      case 'BOSS':
        return 'text-rose-400 border-rose-500/40 bg-rose-500/20 animate-pulse';
    }
  };

  const isCompleted = quest.status === 'COMPLETED';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
      isCompleted 
        ? 'bg-black/30 border-white/5 opacity-60' 
        : 'glass-panel bg-black/60 border-white/10 hover:border-mentra-orange/40 hover:shadow-[0_0_20px_rgba(255,74,0,0.15)]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor()}`}>
                {quest.difficulty}
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                {quest.type}
              </span>
            </div>
            <h3 className={`text-sm sm:text-base font-semibold mt-1 font-display ${isCompleted ? 'line-through text-white/50' : 'text-white'}`}>
              {quest.title}
            </h3>
          </div>
        </div>

        {/* XP Reward Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber font-mono text-xs font-bold flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-mentra-orange" />
          <span>+{quest.rewardXp} XP</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-white/70 leading-relaxed font-sans">
        {quest.description}
      </p>

      {/* Progress Bar & Required Action */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-white/50 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-mentra-amber" />
          <span>ACTION: {quest.requiredAction || 'Execute priority protocol'}</span>
        </div>

        {!isCompleted ? (
          <button
            onClick={handleClaim}
            disabled={isCompleting}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-mono text-xs font-semibold tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,74,0,0.3)] disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCompleting ? 'CLAIMING...' : 'COMPLETE QUEST'}</span>
          </button>
        ) : (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CLAIMED & PERSISTED</span>
          </div>
        )}
      </div>
    </div>
  );
}
