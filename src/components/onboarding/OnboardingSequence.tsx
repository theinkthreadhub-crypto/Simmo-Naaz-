'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Zap, Target, Clock, Layers } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function OnboardingSequence() {
  const { user, profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.display_name || user?.user_metadata?.display_name || 'Operator');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Business', 'Money', 'Learning']);
  const [primaryGoal, setPrimaryGoal] = useState('Scale automated business revenue to ₹1,00,000/mo');
  const [dailyTime, setDailyTime] = useState('2 Hours (Deep Focus)');
  const [prioritizedModules, setPrioritizedModules] = useState<string[]>(['Finance', 'Skills', 'Business']);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const areasList = ['Business', 'Money', 'Learning', 'Fitness', 'Discipline', 'Communication', 'Personal Growth'];
  const modulesList = ['Finance', 'Skills', 'Business', 'Journal', 'Tasks & Quests', 'Autonomous Agents'];
  const timeOptions = ['30 Minutes (Sprint)', '1 Hour (Standard)', '2 Hours (Deep Focus)', '4+ Hours (Hardcore Operator)'];

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = async () => {
    setIsFinalizing(true);
    await completeOnboarding(name, primaryGoal, selectedAreas);
    setIsFinalizing(false);
  };

  return (
    <div className="min-h-screen w-full bg-energy-horizon flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow ambient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-mentra-orange/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="glass-panel-orange p-6 sm:p-10 bg-black/80 border-white/15 shadow-2xl relative">
          
          {/* Progress telemetry header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-mentra-orange animate-pulse shadow-[0_0_8px_#5b6cff]" />
              <span className="font-mono text-xs text-mentra-amber font-semibold uppercase tracking-widest">
                INITIALIZING PLAYER PROFILE // STEP {step} OF 5
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={`w-6 h-1 rounded-full transition-all ${
                    i <= step ? 'bg-gradient-to-r from-mentra-orange to-mentra-amber' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  What should MENTRA call you?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
                  Your identity codename used across telemetry logs and agent communications.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-2">OPERATOR CODENAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operator Naaz"
                  className="w-full bg-white/5 border border-white/20 focus:border-mentra-orange rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(91,108,255,0.4)] disabled:opacity-50"
              >
                <span>CONTINUE SEQUENCE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Areas to Improve */}
          {step === 2 && (
            <div className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  What areas do you want to elevate?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
                  Select core vectors to allocate initial RPG attribute weights.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {areasList.map(area => {
                  const isSelected = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => toggleItem(selectedAreas, setSelectedAreas, area)}
                      className={`p-3.5 rounded-2xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-mentra-orange/20 border-mentra-orange text-white shadow-[0_0_12px_rgba(91,108,255,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{area}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-mentra-amber" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedAreas.length === 0}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(91,108,255,0.4)] disabled:opacity-50"
                >
                  <span>SET VECTORS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Biggest Goal */}
          {step === 3 && (
            <div className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  What is your biggest current macro goal?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
                  The primary milestone your daily quests and AI agents will orient around.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-2">PRIMARY MACRO OBJECTIVE</label>
                <textarea
                  rows={3}
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder="e.g. Build and scale our apparel brand to ₹1,00,000 monthly revenue..."
                  className="w-full bg-white/5 border border-white/20 focus:border-mentra-orange rounded-xl p-3.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!primaryGoal.trim()}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(91,108,255,0.4)] disabled:opacity-50"
                >
                  <span>LOCK GOAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Daily Dedication */}
          {step === 4 && (
            <div className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  How much time can you dedicate daily?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
                  Calibrates daily quest density and protected ultradian focus blocks.
                </p>
              </div>

              <div className="space-y-2.5">
                {timeOptions.map(opt => {
                  const isSelected = dailyTime === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setDailyTime(opt)}
                      className={`w-full p-4 rounded-2xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-mentra-orange/20 border-mentra-orange text-white shadow-[0_0_12px_rgba(91,108,255,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-mentra-amber" />
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-mentra-amber" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(91,108,255,0.4)]"
                >
                  <span>CONFIRM CADENCE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Module Prioritization */}
          {step === 5 && (
            <div className="py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Which modules should MENTRA prioritize?
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1 font-sans">
                  Configures dashboard telemetry order and autonomous agent priority queue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {modulesList.map(mod => {
                  const isSelected = prioritizedModules.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => toggleItem(prioritizedModules, setPrioritizedModules, mod)}
                      className={`p-3.5 rounded-2xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-mentra-orange/20 border-mentra-orange text-white shadow-[0_0_12px_rgba(91,108,255,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{mod}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-mentra-amber" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  BACK
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isFinalizing}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(91,108,255,0.5)] disabled:opacity-50"
                >
                  <span>{isFinalizing ? 'CALIBRATING KERNEL...' : 'INITIALIZE SYSTEM'}</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
