'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Brain,
  Briefcase,
  DollarSign,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function SkillsPage() {
  const skills = useMentraStore((state) => state.skills);
  const addXp = useMentraStore((state) => state.addXp);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BUSINESS': return <Briefcase className="w-4 h-4 text-[#ff8a1f]" />;
      case 'AI': return <Brain className="w-4 h-4 text-violet-400" />;
      case 'FINANCE': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <GraduationCap className="w-4 h-4" /> MENTRA NEURAL SKILL TREE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Interactive Skill Matrix</h1>
          <p className="text-white/60 text-sm mt-1">
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
                className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl hover:border-[#ff8a1f]/50 transition-all flex flex-col justify-between space-y-4 shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-white/70">
                      {getCategoryIcon(skill.category)}
                      <span>{skill.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-0.5 rounded-full bg-[#ff3d00]/20 text-[#ff8a1f] border border-[#ff3d00]/30 font-bold">
                      LV.0{skill.level} / {skill.maxLevel}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{skill.name}</h3>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">{skill.description}</p>

                  {/* Level XP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-white/50">
                      <span>MASTERY XP</span>
                      <span className="text-[#ff8a1f]">{skill.currentXp} / {skill.nextLevelXp} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a1f] transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Practice Quests Checklist */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                    Practice Protocols:
                  </span>
                  {skill.practiceQuests.map((questText, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 flex items-center justify-between"
                    >
                      <span className="line-clamp-1">{questText}</span>
                      <button
                        onClick={() => addXp(50, 'knowledge')}
                        className="text-[10px] font-mono text-[#ff8a1f] hover:text-white ml-2 whitespace-nowrap"
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
