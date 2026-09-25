'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Lock, Mic } from 'lucide-react';
import { SkillNode as SkillNodeType } from '@/types/mentra';

interface SkillNodeProps {
  skill: SkillNodeType;
}

export default function SkillNode({ skill }: SkillNodeProps) {
  const isLocked = !skill.unlocked;
  const progressPercent = Math.min(100, Math.round((skill.currentXp / Math.max(skill.nextLevelXp, 1)) * 100));
  const isPublicSpeaking = skill.name.toLowerCase().includes('speaking') || skill.id.includes('speaking');
  const skillSlug = isPublicSpeaking ? 'skill_public_speaking' : skill.id;

  return (
    <article className={`rounded-[20px] border p-5 sm:p-6 flex h-full flex-col justify-between ${
      isLocked ? 'border-[#292F3B] bg-[#10131A] opacity-60' : 'border-[#292F3B] bg-[#161A22]'
    }`}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-xl border border-[#292F3B] bg-[#10131A] flex items-center justify-center text-[#B7FF3C]">
              {isLocked ? <Lock className="h-[18px] w-[18px]" /> : isPublicSpeaking ? <Mic className="h-[18px] w-[18px]" /> : <Brain className="h-[18px] w-[18px]" />}
            </div>
            <div>
              <div className="mentra-label">{skill.category}</div>
              <h3 className="mt-1 text-lg sm:text-xl uppercase">{skill.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-[#B7FF3C]">LVL {skill.level}</div>
            <div className="mt-1 text-[10px] font-mono text-[#697181]">{skill.currentXp} / {skill.nextLevelXp} XP</div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#A1A8B5]">{skill.description}</p>

        <div className="mt-5">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-[#697181]">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#090B0F]">
            <div className="h-full rounded-full bg-[#B7FF3C]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {!isLocked && (
        <div className="mt-6 border-t border-[#292F3B] pt-4">
          <Link
            href={`/skills/${skillSlug}/coach`}
            className="mentra-primary-button px-4 inline-flex items-center gap-2 text-sm"
          >
            Continue learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}
