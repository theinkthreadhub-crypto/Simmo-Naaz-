'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Brain, 
  Sparkles, 
  ArrowLeft, 
  Mic, 
  Play, 
  CheckCircle2, 
  ShieldAlert, 
  Trophy, 
  Zap, 
  MessageSquare, 
  ChevronRight, 
  Clock, 
  Activity,
  Flame,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';
import { 
  PUBLIC_SPEAKING_SKILL_ID, 
  PUBLIC_SPEAKING_CURRICULUM 
} from '@/lib/learning/publicSpeakingCurriculum';
import { 
  getLearningProfile, 
  getSkillRoadmapWithModules, 
  getPracticeAttempts, 
  getBossMissions 
} from '@/lib/db/learning';
import { 
  LearningProfile, 
  SkillRoadmap, 
  PracticeAttempt, 
  BossMission 
} from '@/types/mentra';

const SKILL_LEVEL_TITLES = [
  'Beginner (Uncalibrated)',
  'Foundation (Grounding & Breath)',
  'Basic Application (Silence & Pacing)',
  'Consistency (PREP Mastery)',
  'Intermediate (Story Arc & Tension)',
  'Practical (Impromptu Defense)',
  'Advanced (Audience Triangulation)',
  'Confident (Rhetorical Command)',
  'High Competence (Keynote Delivery)',
  'Expert Practice (Mass Group Influence)',
  'Mastery Target (Sovereign Orator)'
];

export default function SkillCoachPage() {
  const params = useParams();
  const skillId = (params?.skillId as string) || PUBLIC_SPEAKING_SKILL_ID;
  const { user } = useAuth();
  const { player, addXp } = useMentraStore();

  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [roadmap, setRoadmap] = useState<SkillRoadmap | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [bossMissions, setBossMissions] = useState<BossMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ask Coach Interactive box
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const [prof, rm, atts, bm] = await Promise.all([
          getLearningProfile(user.id, skillId),
          getSkillRoadmapWithModules(user.id, skillId),
          getPracticeAttempts(user.id, skillId),
          getBossMissions(user.id, skillId)
        ]);
        setProfile(prof);
        setRoadmap(rm);
        setAttempts(atts);
        setBossMissions(bm);
      } catch (err) {
        console.warn('[COACH PAGE]: Loading fallback', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.id, skillId]);

  const handleAskCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;

    setIsAnswering(true);
    const q = coachQuestion.toLowerCase();

    setTimeout(() => {
      let ans = `[MENTRA COACH]: For "${coachQuestion}", focus on keeping your chest still and breathing low into your diaphragm. Speak in short 8-10 word bursts, then insert a 2-second deliberate pause.`;
      
      if (q.includes('nervous') || q.includes('darr') || q.includes('fear')) {
        ans = `[MENTRA COACH]: Nervousness is unused physical energy. Perform 2 physiological sighs (double inhale through nose, long 6-second slow exhale) right before you begin speaking. Never fight the adrenaline; redirect it into vocal resonance.`;
      } else if (q.includes('filler') || q.includes('um') || q.includes('like')) {
        ans = `[MENTRA COACH]: To eliminate filler words: notice the micro-pause where you want to say "umm", close your lips tight, and count 1-2 silently. Your audience will perceive that silence as high intellectual confidence.`;
      } else if (q.includes('structure') || q.includes('prep') || q.includes('clear')) {
        ans = `[MENTRA COACH]: Use the PREP framework: State your Point (1 line) -> Give your Reason (Because...) -> Concrete Example (For instance...) -> Re-state your Point (Therefore...). This works in meetings, pitches, and impromptu questions.`;
      }

      setCoachAnswer(ans);
      setIsAnswering(false);
      setCoachQuestion('');
    }, 500);
  };

  const handleToggleBossObjective = async (objectiveId: string, bossMissionId: string) => {
    try {
      const res = await fetch('/api/boss/objective-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId, bossMissionId })
      });
      const data = await res.json();
      if (data.success) {
        setBossMissions(prev => prev.map(bm => {
          if (bm.id !== bossMissionId) return bm;
          const updatedObjs = bm.objectives.map(o => o.id === objectiveId ? { ...o, completed: data.objectiveCompleted } : o);
          return {
            ...bm,
            status: data.bossCompleted ? 'COMPLETED' : bm.status,
            objectives: updatedObjs
          };
        }));
      }
    } catch (err) {
      console.error('Failed to toggle boss objective:', err);
    }
  };

  const currentSkillLevel = roadmap?.current_level || 1;
  const levelTitle = SKILL_LEVEL_TITLES[currentSkillLevel] || SKILL_LEVEL_TITLES[0];
  const firstModule = roadmap?.modules?.[0] || PUBLIC_SPEAKING_CURRICULUM.modules[0];
  const todayLesson = firstModule.lessons?.[0] || PUBLIC_SPEAKING_CURRICULUM.modules[0].lessons[0];
  const activeBoss = bossMissions[0] || PUBLIC_SPEAKING_CURRICULUM.bossMission;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Back & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <Link 
            href="/skills"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-mentra-amber transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO SKILL MATRIX</span>
          </Link>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Brain className="w-4 h-4 text-mentra-orange" />
            <span>ADAPTIVE SKILL COACH</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Executive Public Speaking & Rhetoric
          </h1>
        </div>

        {/* Level Progression Indicator */}
        <div className="p-3.5 sm:p-4 rounded-2xl glass-panel bg-black/60 border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber font-mono text-center">
            <div className="text-[10px] text-white/50">LEVEL</div>
            <div className="text-lg font-bold text-white">{currentSkillLevel.toString().padStart(2, '0')}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white">{levelTitle}</div>
            <div className="text-[10px] font-mono text-white/50 mt-0.5">
              TARGET: LEVEL 10 (SOVEREIGN ORATOR)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left side coach & practice, Right side telemetry & boss */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Today's Lesson & Practice Action */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Today's Adaptive Lesson Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 relative overflow-hidden space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-mentra-amber uppercase px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-mentra-orange" />
                <span>TODAY&apos;S ADAPTIVE LEARNING MISSION</span>
              </span>
              <span className="text-xs font-mono text-white/40">
                MODULE 1 / LESSON 1
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                {todayLesson.title}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                {todayLesson.concept_summary}
              </p>
            </div>

            {/* Framework Steps */}
            {todayLesson.framework_steps && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase text-white/40">EXECUTION PROTOCOL</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80 font-mono">
                  {todayLesson.framework_steps.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-mentra-orange/20 text-mentra-amber flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Practice Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-mono text-white/50">
                REWARD: <strong className="text-mentra-amber">+{todayLesson.xp_reward} XP</strong> (Character) + <strong className="text-mentra-orange">+{todayLesson.skill_xp_reward} Skill XP</strong>
              </div>
              <Link
                href={`/skills/${skillId}/learn/${todayLesson.id || 'lesson_1_1'}`}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(91,108,255,0.4)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>ENTER FOCUSED PRACTICE MODE</span>
              </Link>
            </div>
          </div>

          {/* Ask AI Coach Command Box */}
          <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-mentra-amber uppercase">
              <MessageSquare className="w-4 h-4 text-mentra-orange" />
              <span>MENTRA SPEECH COACH // INSTANT QUERY</span>
            </div>
            <form onSubmit={handleAskCoach} className="flex gap-2">
              <input
                type="text"
                value={coachQuestion}
                onChange={(e) => setCoachQuestion(e.target.value)}
                placeholder="Ask coach: e.g. How do I stop saying 'umm'? or How to structure a pitch?"
                className="flex-1 bg-white/5 border border-white/15 focus:border-mentra-orange rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isAnswering || !coachQuestion.trim()}
                className="px-5 py-3 rounded-2xl bg-mentra-orange text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all font-mono"
              >
                ASK
              </button>
            </form>

            {coachAnswer && (
              <div className="p-4 rounded-2xl bg-mentra-orange/10 border border-mentra-orange/30 text-xs text-white/90 leading-relaxed font-sans animate-in fade-in">
                {coachAnswer}
              </div>
            )}
          </div>

          {/* Recent Practice Attempts History */}
          <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-mentra-amber" />
                <span>PRACTICE ATTEMPTS & AUDIO METRICS</span>
              </div>
              <span className="text-xs font-mono text-white/40">
                {attempts.length} RECORDED RUNS
              </span>
            </div>

            {attempts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center text-xs font-mono text-white/50">
                No speech attempts recorded yet. Launch your 60-second baseline diagnostic to unlock telemetry.
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(att => (
                  <div key={att.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        Attempt #{att.attempt_number}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-white/60">
                        <span>{att.metrics.speaking_rate_wpm || 0} WPM</span>
                        <span>•</span>
                        <span>{att.metrics.filler_words_count || 0} Fillers</span>
                        <span>•</span>
                        <span className="text-emerald-400">★ {att.self_rating}/5</span>
                      </div>
                    </div>
                    {att.transcript && (
                      <p className="text-xs text-white/60 italic line-clamp-2">
                        &quot;{att.transcript}&quot;
                      </p>
                    )}
                    {att.feedback?.next_focus && (
                      <div className="text-[11px] font-mono text-mentra-amber">
                        Next Focus: {att.feedback.next_focus}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Strengths, Weaknesses, Boss Mission */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Adaptive Weaknesses & Strengths Matrix */}
          <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-5">
            <div className="text-xs font-mono text-white/40 uppercase">
              DIAGNOSTIC TELEMETRY
            </div>

            {/* Weakness Alert */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>PRIMARY BOTTLENECK</span>
              </div>
              <p className="text-xs text-white/80">
                {profile?.main_difficulty || 'Pacing acceleration & vocal tremor under adrenaline.'}
              </p>
            </div>

            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ACTIVE STRENGTH</span>
              </div>
              <p className="text-xs text-white/80">
                {profile?.current_strengths?.[0] || 'Clear subject conviction and strong thematic structure.'}
              </p>
            </div>
          </div>

          {/* Real-World Boss Mission */}
          <div className="p-6 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-mentra-amber uppercase font-bold">
                <Trophy className="w-4 h-4 text-mentra-orange" />
                <span>BOSS MISSION</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mentra-orange/20 text-mentra-amber">
                +500 XP
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-display">
                {activeBoss.title}
              </h3>
              <p className="text-xs text-white/70 font-sans">
                {activeBoss.description}
              </p>
            </div>

            {/* Boss Objectives */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-mono text-white/40 uppercase">MANDATORY OBJECTIVES</div>
              {activeBoss.objectives?.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => handleToggleBossObjective(obj.id, activeBoss.id || 'bm_ps_01')}
                  className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-start gap-2.5 text-xs transition-colors"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    obj.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-white/30'
                  }`}>
                    {obj.completed && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <span className={`text-[11px] leading-snug ${obj.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                    {obj.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
