'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Zap,
  Flame,
  Shield
} from 'lucide-react';

export default function FocusModePage() {
  const [plannedDuration, setPlannedDuration] = useState<number>(45); // in minutes
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTask, setActiveTask] = useState('Deep Sovereign Focus Session');
  const [reflection, setReflection] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleStart = async () => {
    setIsRunning(true);
    try {
      await fetch('/api/focus/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', plannedDurationMin: plannedDuration })
      });
    } catch {}
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = (duration: number) => {
    setIsRunning(false);
    setPlannedDuration(duration);
    setSecondsRemaining(duration * 60);
    setIsCompleted(false);
    setXpEarned(null);
  };

  const handleFinishSession = async () => {
    setIsRunning(false);
    setIsCompleted(true);
    const actualMin = Math.round((plannedDuration * 60 - secondsRemaining) / 60);

    try {
      const res = await fetch('/api/focus/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE',
          actualDurationMin: Math.max(actualMin, 1),
          reflections: reflection || 'Deep focus completed.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setXpEarned(data.xpEarned || Math.round(actualMin * 1.5));
      }
    } catch {
      setXpEarned(Math.round(plannedDuration * 1.5));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((plannedDuration * 60 - secondsRemaining) / (plannedDuration * 60)) * 100;

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 flex flex-col items-center justify-center text-center">
        {/* Preset Selector */}
        {!isRunning && !isCompleted && (
          <div className="flex items-center gap-2 mb-8 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            {[
              { label: '25 min (Sprint)', val: 25 },
              { label: '45 min (Deep Work)', val: 45 },
              { label: '60 min (Mastery)', val: 60 }
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => handleReset(preset.val)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  plannedDuration === preset.val
                    ? 'bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold shadow-lg shadow-mentra-orange/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Focus Task Input / Display */}
        <div className="mb-8 w-full max-w-md">
          {isRunning ? (
            <div className="text-sm font-semibold text-white/90 font-mono tracking-wide">
              TARGET: <span className="text-mentra-amber">{activeTask}</span>
            </div>
          ) : (
            <input
              type="text"
              value={activeTask}
              onChange={(e) => setActiveTask(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white text-center focus:outline-none focus:border-mentra-orange"
            />
          )}
        </div>

        {/* Central Radial Focus Timer Visual */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Subtle Ambient Pulse */}
          <div
            className={`absolute w-72 h-72 rounded-full transition-all duration-1000 ${
              isRunning
                ? 'bg-mentra-orange/15 scale-110 blur-3xl animate-pulse'
                : 'bg-white/5 scale-95 blur-2xl'
            }`}
          />

          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shadow-2xl">
            <span className="text-5xl sm:text-6xl font-extrabold font-mono tracking-wider text-white">
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-2">
              {isRunning ? 'DEEP IMMERSION ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Controls */}
        {!isCompleted ? (
          <div className="flex items-center gap-4 mt-6">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-mentra-orange/25 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Engage Focus</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => handleReset(plannedDuration)}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isRunning && (
              <button
                onClick={handleFinishSession}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Complete Early
              </button>
            )}
          </div>
        ) : (
          /* Completion & Reflection Box */
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-emerald-500/30 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Focus Session Complete!</h3>
            {xpEarned && (
              <div className="text-sm font-mono text-emerald-400 font-bold">
                +{xpEarned} XP Awarded 🌟
              </div>
            )}
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Any quick insights or wins from this session?"
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleReset(plannedDuration)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold text-xs uppercase tracking-wider hover:brightness-110"
            >
              Start New Focus Block
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
