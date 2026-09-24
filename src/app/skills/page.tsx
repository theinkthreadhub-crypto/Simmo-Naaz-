'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  TrendingUp,
  Brain,
  Briefcase,
  DollarSign,
  Sparkles,
  Zap,
  CheckCircle,
  Lock,
  Unlock,
  GraduationCap
} from 'lucide-react';

export default function SkillsPage() {
  const skills = useMentraStore((state) => state.skills);
  const addXp = useMentraStore((state) => state.addXp);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BUSINESS': return <Briefcase className="w-4 h-4 text-cyan-400" />;
      case 'AI': return <Brain className="w-4 h-4 text-violet-400" />;
      case 'FINANCE': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <GraduationCap className="w-4 h-4" /> MENTRA NEURAL SKILL TREE
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Skill Matrix</h1>
          <p className="text-slate-400 text-sm mt-1">
            Progressive mastery roadmaps across AI engineering, marketing science, deal negotiation, and focus sovereignty.
          </p>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Skill Tree Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => {
            const progressPercent = Math.min(100, Math.round((skill.currentXp / skill.nextLevelXp) * 100));

            return (
              <div
                key={skill.id}
                className="p-5 rounded-2xl bg-[#0d101a] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                      {getCategoryIcon(skill.category)}
                      <span>{skill.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold">
                      LV.0{skill.level} / {skill.maxLevel}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{skill.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{skill.description}</p>

                  {/* Level XP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>MASTERY XP</span>
                      <span className="text-cyan-400">{skill.currentXp} / {skill.nextLevelXp} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Practice Quests Checklist */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Practice Protocols:
                  </span>
                  {skill.practiceQuests.map((questText, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span className="line-clamp-1">{questText}</span>
                      <button
                        onClick={() => addXp(50, 'knowledge')}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 ml-2 whitespace-nowrap"
                      >
                        +50 XP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
