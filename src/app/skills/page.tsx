'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import SkillNode from '@/components/skills/SkillNode';
import { GraduationCap } from 'lucide-react';

export default function SkillsPage() {
  const skills = useMentraStore((state) => state.skills);
  const addXp = useMentraStore((state) => state.addXp);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <GraduationCap className="w-4 h-4" /> MENTRA NEURAL SKILL TREE
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Skill Matrix</h1>
            <p className="text-slate-400 text-sm mt-1">
              Progressive mastery roadmaps across AI engineering, marketing science, deal negotiation, and focus sovereignty.
            </p>
          </div>

          <CommandBar />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {skills.map((skill) => (
              <SkillNode key={skill.id} skill={skill} onPractice={() => addXp(50, 'knowledge')} />
            ))}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
