'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Trophy, Zap, Plus, X, ArrowRight, Mic, BookOpen, Clock } from 'lucide-react';
import SkillNode from '@/components/skills/SkillNode';
import { useMentraStore } from '@/lib/store/mentraStore';
import { SkillNode as SkillNodeType } from '@/types/mentra';
import { PUBLIC_SPEAKING_TREE_NODES } from '@/lib/learning/publicSpeakingCurriculum';

export default function SkillsPage() {
  const router = useRouter();
  const { skills, player } = useMentraStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Skill Onboarding Questionnaire State
  const [skillName, setSkillName] = useState('');
  const [whyLearn, setWhyLearn] = useState('');
  const [currentExperience, setCurrentExperience] = useState('Beginner');
  const [targetGoal, setTargetGoal] = useState('');
  const [timeAvailableMins, setTimeAvailableMins] = useState(15);
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [preferredLanguage, setPreferredLanguage] = useState('Both (Hindi + English)');
  const [learningPreference, setLearningPreference] = useState('Practical Execution');
  const [mainDifficulty, setMainDifficulty] = useState('Nervousness & Hesitation');

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/skills/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skillName.trim(),
          whyLearn: whyLearn.trim() || 'Accelerate personal competence and life mastery',
          currentExperience,
          targetGoal: targetGoal.trim() || 'Execute effectively under high stakes',
          timeAvailableMins,
          targetDate,
          preferredLanguage,
          learningPreference,
          mainDifficulty
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        router.push(`/skills/${data.skillId}/coach`);
      }
    } catch (err) {
      console.error('Failed to create skill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine Public Speaking Reference with user skills
  const publicSpeakingSkill: SkillNodeType = {
    id: 'skill_public_speaking',
    name: 'Executive Public Speaking & Rhetoric',
    category: 'COMMUNICATION',
    level: 1,
    maxLevel: 10,
    currentXp: 120,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'Master somatic breathing, 2-second strategic pauses, zero-filler clarity, and the PREP framework for meetings, keynotes, and high-stakes pitches.',
    practiceQuests: ['60-Second Baseline Self Intro', '2-Second Deliberate Silence Drill'],
    roadmap: ['Baseline Diagnostic', 'PREP Framework', 'Eliminating Filler Words', 'Boss Challenge']
  };

  const allSkills = [
    publicSpeakingSkill,
    ...skills.filter(s => !s.name.toLowerCase().includes('speaking'))
  ];

  const totalSkillXp = allSkills.reduce((acc, s) => acc + s.currentXp, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Brain className="w-4 h-4 text-mentra-orange" />
            <span>ADAPTIVE SKILL LEARNING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Skill & Competency Matrix
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 px-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-xs font-mono">
            <span className="text-white/40">TOTAL SKILL XP: </span>
            <span className="text-mentra-amber font-bold">{totalSkillXp} XP</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ LEARN NEW SKILL</span>
          </button>
        </div>
      </div>

      {/* Skills Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allSkills.map(skill => (
          <SkillNode key={skill.id} skill={skill} />
        ))}
      </div>

      {/* Public Speaking Deep-Dive Skill Tree Preview */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase">
              <Mic className="w-4 h-4 text-mentra-orange" />
              <span>REFERENCE IMPLEMENTATION TREE // PUBLIC SPEAKING</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
              Neural Skill Progression Nodes
            </h2>
          </div>
          <button
            onClick={() => router.push('/skills/skill_public_speaking/coach')}
            className="px-5 py-2.5 rounded-full bg-mentra-orange text-white font-mono text-xs font-semibold hover:opacity-90 transition-all self-start sm:self-auto flex items-center gap-2"
          >
            <span>LAUNCH COACH SCREEN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PUBLIC_SPEAKING_TREE_NODES.map((node) => (
            <div 
              key={node.id}
              className={`p-4 rounded-2xl border transition-all ${
                node.unlocked 
                  ? 'bg-black/60 border-mentra-orange/30 shadow-[0_0_15px_rgba(255,74,0,0.1)]' 
                  : 'bg-black/30 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-mentra-amber uppercase font-bold">
                  LEVEL {node.level}
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  {node.unlocked ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white font-display mb-1">
                {node.name}
              </h4>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                {node.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* NEW SKILL ONBOARDING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-white/15 shadow-[0_0_50px_rgba(255,74,0,0.3)] space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase">
                <Brain className="w-4 h-4 text-mentra-orange" />
                <span>ADAPTIVE LEARNING PROFILE SETUP</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  WHICH SKILL DO YOU WANT TO LEARN?
                </label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Public Speaking, Python, Deal Negotiation, Sales..."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  WHY DO YOU WANT TO LEARN IT? (PRIMARY PURPOSE)
                </label>
                <textarea
                  rows={2}
                  required
                  value={whyLearn}
                  onChange={(e) => setWhyLearn(e.target.value)}
                  placeholder="e.g. I need to pitch investors and lead my company team with executive clarity."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">CURRENT EXPERIENCE</label>
                  <select
                    value={currentExperience}
                    onChange={(e) => setCurrentExperience(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Beginner">Beginner (0-1 yr)</option>
                    <option value="Intermediate">Intermediate (Practical)</option>
                    <option value="Advanced">Advanced (Refining)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">TIME AVAILABLE/DAY</label>
                  <select
                    value={timeAvailableMins}
                    onChange={(e) => setTimeAvailableMins(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value={15}>15 Mins / Day</option>
                    <option value={30}>30 Mins / Day</option>
                    <option value={60}>60 Mins / Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">PREFERRED LANGUAGE</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Both (Hindi + English)">Both (Hindi + English)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">MAIN DIFFICULTY</label>
                  <input
                    type="text"
                    value={mainDifficulty}
                    onChange={(e) => setMainDifficulty(e.target.value)}
                    placeholder="e.g. Nervousness, Fast pace"
                    className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !skillName.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
              >
                {isSubmitting ? 'GENERATING ADAPTIVE ROADMAP...' : 'INITIALIZE SKILL & ENTER COACH'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
