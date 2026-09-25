'use client';

import React from 'react';
import { Sparkles, Trophy, Zap, ArrowRight, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  totalXp: number;
  statsIncreased?: string[];
  achievementsUnlocked?: string[];
}

export default function LevelUpModal({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  totalXp,
  statsIncreased = ['Focus +2', 'Discipline +2', 'Knowledge +2'],
  achievementsUnlocked = []
}: LevelUpModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      // Fire subtle gold/amber confetti
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff4a00', '#f59e0b', '#fbbf24', '#ffffff']
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-mentra-orange/40 shadow-[0_0_50px_rgba(255,74,0,0.3)] text-center space-y-6 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-mentra-orange/20 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Level Up Badge */}
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-mentra-orange/20 to-mentra-amber/20 border border-mentra-orange/40 text-mentra-amber mx-auto shadow-[0_0_20px_rgba(255,74,0,0.3)]">
          <Trophy className="w-10 h-10 text-mentra-orange animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-mentra-amber">
            CHARACTER ASCENSION
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            LEVEL UP!
          </h2>
          <div className="text-lg font-mono font-bold text-white/90">
            LEVEL {previousLevel.toString().padStart(2, '0')} → <span className="text-mentra-orange">LEVEL {newLevel.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Perks / Stats Increased */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2.5">
          <div className="text-[11px] font-mono text-white/40 uppercase">ATTRIBUTES ENHANCED</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/80">
            {statsIncreased.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-mentra-amber flex-shrink-0" />
                <span>{stat}</span>
              </div>
            ))}
          </div>
        </div>

        {achievementsUnlocked.length > 0 && (
          <div className="p-3 rounded-xl bg-mentra-orange/10 border border-mentra-orange/30 text-xs font-mono text-mentra-amber flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-mentra-orange" />
            <span>Achievement Unlocked: {achievementsUnlocked[0]}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>CONTINUE CONQUEST</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
