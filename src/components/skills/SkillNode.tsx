'use client';

import React from 'react';
import { SkillNode as SkillNodeType } from '@/types/mentra';
import { TrendingUp, Brain, Briefcase, DollarSign, Sparkles } from 'lucide-react';

interface SkillNodeProps {
  skill: SkillNodeType;
  onPractice?: (id: string) => void;
}

export default function SkillNode({ skill, onPractice }: SkillNodeProps) {
  const percent = Math.min(100, Math.round((skill.currentXp / skill.nextLevelXp) * 100));

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'BUSINESS': return <Briefcase className="w-4 h-4 text-cyan-400" />;
      case 'AI': return <Brain className="w-4 h-4 text-violet-400" />;
      case 'FINANCE': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all flex flex-col justify-between space-y-4 shadow-xl">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
            {getIcon(skill.category)}
            <span>{skill.category}</span>
          </div>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold">
            LV.0{skill.level} / {skill.maxLevel}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mb-1">{skill.name}</h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{skill.description}</p>

        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>MASTERY XP</span>
            <span className="text-cyan-400">{skill.currentXp} / {skill.nextLevelXp} ({percent}%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {skill.practiceQuests.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Practice Missions:</span>
          {skill.practiceQuests.slice(0, 1).map((q, i) => (
            <div key={i} className="text-xs text-slate-300 flex items-center justify-between bg-white/[0.02] p-2 rounded-xl border border-white/5">
              <span className="line-clamp-1">{q}</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold ml-2">+40 XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
