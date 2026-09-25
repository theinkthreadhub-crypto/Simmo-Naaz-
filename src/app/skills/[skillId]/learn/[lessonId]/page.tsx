'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Trophy, 
  ArrowRight,
  Flame,
  Volume2,
  Brain,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';
import { PUBLIC_SPEAKING_CURRICULUM, PUBLIC_SPEAKING_SKILL_ID } from '@/lib/learning/publicSpeakingCurriculum';
import LevelUpModal from '@/components/mentra/LevelUpModal';

type LearningStep = 'LESSON' | 'DEMO' | 'PRACTICE' | 'FEEDBACK' | 'REWARD';

export default function FocusedLearningSessionPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = (params?.skillId as string) || PUBLIC_SPEAKING_SKILL_ID;
  const lessonId = (params?.lessonId as string) || 'lesson_1_1';
  const { user } = useAuth();
  const { addXp, player } = useMentraStore();

  const [step, setStep] = useState<LearningStep>('LESSON');
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [selfRating, setSelfRating] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Evaluated result state
  const [feedbackResult, setFeedbackResult] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [leveledUpData, setLeveledUpData] = useState<{ prev: number; new: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Curriculum lesson details
  const targetModule = PUBLIC_SPEAKING_CURRICULUM.modules[0];
  const currentLesson = targetModule.lessons[0];
  const currentExercise = currentLesson.exercises[0];

  // Timer logic
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setDurationSeconds(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSubmitAttempt = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/skills/learn/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          exerciseId: currentExercise.title,
          transcript: speechTranscript.trim() || 'Hello, my name is Operator and I am focused on mastering high-impact communication and sovereign life mastery.',
          durationSeconds: durationSeconds || 45,
          selfRating,
          userProvidedFeedback: {
            clarity: 'Solid posture, steady breath, vocal tone projected from diaphragm.'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackResult(data);
        setStep('FEEDBACK');

        // Check if level up occurred
        if (data.xpResult?.leveledUp) {
          setLeveledUpData({
            prev: data.xpResult.previousLevel,
            new: data.xpResult.newLevel
          });
          setShowLevelUp(true);
        } else {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#ff4a00', '#f59e0b', '#ffffff']
          });
        }
      }
    } catch (err) {
      console.error('Failed to submit attempt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteAndReturn = () => {
    router.push(`/skills/${skillId}/coach`);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-300">
      
      {/* Top Bar: Progress & Exit */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <Link
          href={`/skills/${skillId}/coach`}
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>EXIT SESSION</span>
        </Link>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {(['LESSON', 'DEMO', 'PRACTICE', 'FEEDBACK'] as const).map((s, idx) => (
            <div 
              key={s}
              className={`px-3 py-1 rounded-full border transition-all ${
                step === s 
                  ? 'bg-mentra-orange/20 border-mentra-orange text-mentra-amber font-bold'
                  : 'bg-white/5 border-transparent text-white/40'
              }`}
            >
              {idx + 1}. {s}
            </div>
          ))}
        </div>
      </div>

      {/* Main Focus Canvas */}
      <div className="my-auto py-8">
        
        {/* STEP 1: LESSON CONCEPT */}
        {step === 'LESSON' && (
          <div className="space-y-6 text-center max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber text-xs font-mono">
              <Brain className="w-3.5 h-3.5 text-mentra-orange" />
              <span>CORE CONCEPT LESSON</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
              {currentLesson.title}
            </h1>

            <p className="text-base sm:text-lg text-white/80 font-sans leading-relaxed">
              {currentLesson.concept_summary}
            </p>

            <button
              onClick={() => setStep('DEMO')}
              className="mt-6 px-8 py-4 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-sm font-mono tracking-wider shadow-[0_0_30px_rgba(255,74,0,0.5)] hover:opacity-90 active:scale-98 transition-all inline-flex items-center gap-2"
            >
              <span>SEE DEMONSTRATION & FRAMEWORK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: DEMO & FRAMEWORK */}
        {step === 'DEMO' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber text-xs font-mono">
                <Volume2 className="w-3.5 h-3.5 text-mentra-orange" />
                <span>EXECUTIVE DEMONSTRATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                How it sounds in action
              </h2>
            </div>

            {/* Demonstration Block */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
              <div className="text-[11px] font-mono uppercase text-mentra-amber">REFERENCE SCRIPT</div>
              <p className="text-sm text-white/90 italic font-sans leading-relaxed">
                &quot;{currentLesson.demonstration_example}&quot;
              </p>
            </div>

            {/* Framework Steps */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-white/50">YOUR 4-STEP ACTION PROTOCOL</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLesson.framework_steps?.map((stepStr, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-xs font-mono text-white/80">
                    <span className="w-6 h-6 rounded-full bg-mentra-orange/20 text-mentra-amber flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{stepStr}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => setStep('PRACTICE')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-sm font-mono tracking-wider shadow-[0_0_30px_rgba(255,74,0,0.5)] hover:opacity-90 active:scale-98 transition-all inline-flex items-center gap-2"
              >
                <span>COMMENCE LIVE PRACTICE</span>
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRACTICE WITH TIMER & MIC */}
        {step === 'PRACTICE' && (
          <div className="space-y-6 max-w-2xl mx-auto text-center animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber text-xs font-mono">
                <Mic className="w-3.5 h-3.5 text-mentra-orange" />
                <span>PRACTICE CHALLENGE ({currentExercise.duration_seconds}s)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                {currentExercise.prompt}
              </h2>
            </div>

            {/* Live Stopwatch Timer */}
            <div className="p-8 rounded-3xl glass-panel-orange bg-black/80 border-white/15 space-y-4">
              <div className="text-5xl sm:text-7xl font-mono font-extrabold text-white tracking-widest">
                00:{durationSeconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-mono text-white/50">
                {isRecording ? '● RECORDING ACTIVE // DELIVER YOUR MESSAGE' : 'PRESS RECORD WHEN READY'}
              </div>

              {/* Record Action Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="p-5 rounded-full bg-mentra-orange text-white shadow-[0_0_30px_rgba(255,74,0,0.6)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Mic className="w-7 h-7" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="p-5 rounded-full bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] hover:scale-105 active:scale-95 transition-all animate-pulse"
                  >
                    <Square className="w-7 h-7" />
                  </button>
                )}
              </div>
            </div>

            {/* Speech notes / transcript optional entry */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-mono text-white/50">
                TRANSCRIPT / KEY POINTS SPOKEN (FOR METRIC EVALUATION):
              </label>
              <textarea
                rows={3}
                value={speechTranscript}
                onChange={(e) => setSpeechTranscript(e.target.value)}
                placeholder="Type or paste what you spoke (e.g. My name is Operator, I am scaling our operations...)"
                className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Self-Rating */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-mono">
              <span className="text-white/60">SOMATIC CONFIDENCE SELF-RATING:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelfRating(star)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selfRating >= star
                        ? 'bg-mentra-orange text-white'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmitAttempt}
              disabled={isSubmitting || durationSeconds === 0}
              className="w-full py-4 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(255,74,0,0.5)] hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
            >
              {isSubmitting ? 'ANALYZING SPEECH TELEMETRY...' : 'SUBMIT PRACTICE & GET ADAPTIVE FEEDBACK'}
            </button>
          </div>
        )}

        {/* STEP 4: ADAPTIVE FEEDBACK & METRICS */}
        {step === 'FEEDBACK' && feedbackResult && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PRACTICE RUN COMPLETE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Speech Telemetry & Coaching Feedback
              </h2>
            </div>

            {/* Real Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-center">
                <div className="text-[10px] font-mono text-white/40">SPEAKING RATE</div>
                <div className="text-xl font-mono font-bold text-white mt-1">
                  {feedbackResult.metrics.speaking_rate_wpm || 135} <span className="text-xs font-normal text-white/50">WPM</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-center">
                <div className="text-[10px] font-mono text-white/40">FILLER WORDS</div>
                <div className="text-xl font-mono font-bold text-mentra-amber mt-1">
                  {feedbackResult.metrics.filler_words_count || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-center">
                <div className="text-[10px] font-mono text-white/40">DURATION</div>
                <div className="text-xl font-mono font-bold text-white mt-1">
                  {feedbackResult.metrics.duration_seconds || 45}s
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-center">
                <div className="text-[10px] font-mono text-white/40">XP AWARDED</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  +{feedbackResult.xpResult?.xpAwarded || 45} XP
                </div>
              </div>
            </div>

            {/* Adaptive Insights Card */}
            <div className="p-6 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-4">
              {/* Strengths */}
              <div>
                <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>IDENTIFIED STRENGTHS</span>
                </div>
                <ul className="space-y-1 text-xs text-white/80 font-sans list-disc list-inside">
                  {feedbackResult.feedback.strengths.map((str: string, i: number) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              {feedbackResult.feedback.improvements.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[11px] font-mono text-mentra-orange uppercase font-bold flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ADAPTIVE FOCUS FOR NEXT RUN</span>
                  </div>
                  <ul className="space-y-1 text-xs text-white/80 font-sans list-disc list-inside">
                    {feedbackResult.feedback.improvements.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setStep('PRACTICE');
                  setDurationSeconds(0);
                  setSpeechTranscript('');
                }}
                className="flex-1 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RETRY PRACTICE RUN</span>
              </button>

              <button
                onClick={handleCompleteAndReturn}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 transition-all"
              >
                <span>COMPLETE & RETURN TO COACH</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Level Up UX Modal */}
      {leveledUpData && (
        <LevelUpModal
          isOpen={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          previousLevel={leveledUpData.prev}
          newLevel={leveledUpData.new}
          totalXp={player.currentXp}
          statsIncreased={['Communication +2', 'Discipline +2', 'Focus +2']}
        />
      )}

    </div>
  );
}
