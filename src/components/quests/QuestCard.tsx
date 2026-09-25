'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  DollarSign,
  Dumbbell,
  GraduationCap,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Quest } from '@/types/mentra';
import { useMentraStore } from '@/lib/store/mentraStore';

interface QuestCardProps {
  quest: Quest;
  onComplete?: () => void;
  onPostReflection?: (questId: string, questTitle: string) => void;
}

export default function QuestCard({ quest, onComplete, onPostReflection }: QuestCardProps) {
  const { completeQuest } = useMentraStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const isCompleted = quest.status === 'COMPLETED';

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const res = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: quest.id }),
      });
      const data = await res.json();

      completeQuest(quest.id);

      if (
        data.success &&
        onPostReflection &&
        (quest.type === 'MAIN' || quest.type === 'BOSS' || quest.difficulty === 'HARD' || quest.difficulty === 'EPIC')
      ) {
        onPostReflection(quest.id, quest.title);
      }
    } catch (err) {
      console.warn('Task completion API fallback:', err);
      completeQuest(quest.id);
    } finally {
      setIsCompleting(false);
      onComplete?.();
    }
  };

  return (
    <article
      className={`rounded-[18px] border p-4 sm:p-5 transition-colors ${
        isCompleted
          ? 'border-[#292F3B] bg-[#10131A] opacity-65'
          : 'border-[#292F3B] bg-[#161A22] hover:border-[#3A424F]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border border-[#292F3B] bg-[#10131A] flex items-center justify-center">
            <CategoryIcon category={quest.category} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#292F3B] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.1em] text-[#A1A8B5]">
                {quest.type}
              </span>
              <span className="rounded-full border border-[#292F3B] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.1em] text-[#697181]">
                {quest.difficulty}
              </span>
            </div>
            <h3 className={`mt-2 text-base sm:text-lg uppercase leading-tight ${isCompleted ? 'line-through text-[#697181]' : 'text-[#F5F7FA]'}`}>
              {quest.title}
            </h3>
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-[#B7FF3C]/25 bg-[#B7FF3C]/10 px-2.5 py-1 text-[10px] font-mono text-[#B7FF3C]">
          +{quest.rewardXp} XP
        </div>
      </div>

      {quest.description && (
        <p className="mt-3 text-sm leading-relaxed text-[#A1A8B5]">{quest.description}</p>
      )}

      {typeof quest.progressPercent === 'number' && !isCompleted && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-[#697181]">
            <span>Progress</span>
            <span>{quest.progressPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#090B0F]">
            <div
              className="h-full rounded-full bg-[#B7FF3C]"
              style={{ width: `${Math.min(100, Math.max(0, quest.progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-[#292F3B] pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs text-[#697181]">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B7FF3C]" />
          <span>{quest.requiredAction || 'No next action added.'}</span>
        </div>

        {isCompleted ? (
          <div className="min-h-11 inline-flex items-center gap-2 text-xs font-semibold text-[#4DDB8A]">
            <CheckCircle2 className="h-4 w-4" />
            Done
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="mentra-primary-button px-4 inline-flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleting ? 'Saving...' : 'Mark done'}
          </button>
        )}
      </div>
    </article>
  );
}

function CategoryIcon({ category }: { category: Quest['category'] }) {
  const className = 'h-4 w-4 text-[#B7FF3C]';
  switch (category) {
    case 'BUSINESS':
      return <Briefcase className={className} />;
    case 'FINANCE':
      return <DollarSign className={className} />;
    case 'LEARNING':
      return <GraduationCap className={className} />;
    case 'FITNESS':
      return <Dumbbell className={className} />;
    case 'COMMUNICATION':
      return <Sparkles className={className} />;
    default:
      return <Heart className={className} />;
  }
}
