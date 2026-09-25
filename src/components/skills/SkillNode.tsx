'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Lock, CheckCircle2, ChevronRight, Zap, Play, Mic, Sparkles } from 'lucide-react';
import { SkillNode as SkillNodeType } from '@/types/mentra';
import { useMentraStore } from '@/lib/store/mentraStore';

interface SkillNodeProps {
  skill: SkillNodeType;
}

export default function SkillNode({ skill }: SkillNodeProps) {
  const { addXp } = useMentraStore();

  const isLocked = !skill.unlocked;
  const progressPercent = Math.min(100, Math.round((skill.currentXp / skill.nextLevelXp) * 100));
  const isPublicSpeaking = skill.name.toLowerCase().includes('speaking') || skill.id.includes('speaking');
  const skillSlug = isPublicSpeaking ? 'skill_public_speaking' : skill.id;

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
      isLocked 
        ? 'bg-black/40 border-white/5 opacity-50' 
        : 'glass-panel bg-black/60 border-white/10 hover:border-mentra-orange/40 hover:shadow-[0_0_25px_rgba(255,74,0,0.15)]'
    }`}>
      <div>
        {/* Node Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber">
              {isLocked ? <Lock className="w-5 h-5 text-white/40" /> : isPublicSpeaking ? <Mic className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-mentra-amber uppercase tracking-wider px-2 py-0.5 rounded-full bg-mentra-orange/10 border border-mentra-orange/20">
                  {skill.category}
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  RANK {skill.level}/{skill.maxLevel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 font-display">
                {skill.name}
              </h3>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs font-bold text-mentra-amber">LEVEL {skill.level}</div>
            <div className="text-[10px] text-white/40">{skill.currentXp} / {skill.nextLevelXp} XP</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/70 leading-relaxed font-sans">
          {skill.description}
        </p>

        {/* Progress XP Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mb-1.5">
            <span>MASTERY PROGRESS</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-mentra-orange to-mentra-amber rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono text-white/40">
          {isPublicSpeaking ? '8 CURATED MODULES + BOSS CHALLENGES' : 'PRACTICE MODULES READY'}
        </span>

        <Link
          href={`/skills/${skillSlug}/coach`}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,74,0,0.3)] hover:opacity-90 active:scale-95 transition-all"
        >
          <span>ENTER AI COACH</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
