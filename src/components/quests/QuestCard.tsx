'use client';

import React, { useState } from 'react';
import { CheckCircle2, Briefcase, DollarSign, GraduationCap, Dumbbell, Heart, Sparkles, Target, AlertCircle } from 'lucide-react';
import { Quest } from '@/types/mentra';

interface QuestCardProps {
  quest: Quest;
  onComplete?: () => void | Promise<void>;
  onPostReflection?: (questId: string, questTitle: string) => void;
}

export default function QuestCard({ quest, onComplete, onPostReflection }: QuestCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsCompleting(true);
    setError(null);
    try {
      const response = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: quest.id })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Quest was not completed.');

      await onComplete?.();
      if (onPostReflection && (quest.type === 'MAIN' || quest.type === 'BOSS' || quest.difficulty === 'HARD' || quest.difficulty === 'EPIC')) {
        onPostReflection(quest.id, quest.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quest was not completed.');
    } finally {
      setIsCompleting(false);
    }
  };

  const icon = quest.category === 'BUSINESS' ? <Briefcase className="w-4 h-4" /> :
    quest.category === 'FINANCE' ? <DollarSign className="w-4 h-4" /> :
    quest.category === 'LEARNING' ? <GraduationCap className="w-4 h-4" /> :
    quest.category === 'FITNESS' ? <Dumbbell className="w-4 h-4" /> : <Heart className="w-4 h-4" />;

  const isCompleted = quest.status === 'COMPLETED';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${isCompleted ? 'bg-black/30 border-white/5 opacity-65' : 'bg-black/60 border-white/10'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0"><div className="p-2 rounded-xl bg-white/5 h-fit">{icon}</div><div className="min-w-0"><div className="text-[10px] text-white/40">{quest.difficulty} • {quest.type}</div><h3 className={`mt-1 font-semibold text-white ${isCompleted ? 'line-through' : ''}`}>{quest.title}</h3></div></div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-mentra-orange/15 text-mentra-amber text-xs font-mono"><Sparkles className="w-3 h-3" />+{quest.rewardXp} XP</div>
      </div>
      {quest.description && <p className="mt-3 text-xs text-white/65">{quest.description}</p>}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-white/45 flex gap-1.5"><Target className="w-3.5 h-3.5" />{quest.requiredAction || 'Complete the stated objective'}</div>
        {!isCompleted && <button onClick={handleClaim} disabled={isCompleting} className="px-4 py-2 rounded-full bg-mentra-orange text-white text-xs font-semibold disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />{isCompleting ? 'SAVING…' : 'COMPLETE QUEST'}</button>}
        {isCompleted && <span className="text-xs text-emerald-400">Persisted as completed</span>}
      </div>
      {error && <div className="mt-3 text-xs text-rose-300 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    </div>
  );
}
