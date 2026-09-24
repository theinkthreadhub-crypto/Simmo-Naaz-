'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function JournalPage() {
  const journalEntries = useMentraStore((state) => state.journalEntries);
  const addJournalEntry = useMentraStore((state) => state.addJournalEntry);

  const [rawContent, setRawContent] = useState('');
  const [win, setWin] = useState('');
  const [lesson, setLesson] = useState('');
  const [decision, setDecision] = useState('');
  const [mood, setMood] = useState<'PEAK' | 'PRODUCTIVE' | 'NEUTRAL' | 'EXHAUSTED' | 'REFLECTIVE'>('PEAK');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContent.trim()) return;

    addJournalEntry({
      rawContent,
      summary: rawContent.slice(0, 120) + '...',
      wins: win ? [win] : ['Completed daily deep focus cycles'],
      problems: [],
      decisions: decision ? [decision] : [],
      lessons: lesson ? [lesson] : [],
      tomorrowActions: ['Execute morning priority mission'],
      mood,
      tags: ['DailyLog', 'Reflection', 'Discipline']
    });

    setRawContent('');
    setWin('');
    setLesson('');
    setDecision('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
            <BookOpen className="w-4 h-4" /> MENTRA NEURAL JOURNAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Daily Reflection & Synthesis</h1>
          <p className="text-white/60 text-sm mt-1">
            Log raw thoughts or voice memos. MENTRA synthesizes lessons, extracts permanent memory anchors, and rewards +60 XP.
          </p>
        </div>

        {/* Command Bar */}
        <CommandBar />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Journal Editor Form */}
          <div className="lg:col-span-7 space-y-4">
            <form
              onSubmit={handleSaveJournal}
              className="p-6 sm:p-8 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/80 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff8a1f]" /> NEW REFLECTION ENTRY
                </span>
                <span className="text-xs font-mono text-white/40">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Mood selector */}
              <div>
                <label className="text-xs font-mono text-white/50 block mb-1.5">STATE OF MIND / MOOD</label>
                <div className="flex flex-wrap gap-2">
                  {(['PEAK', 'PRODUCTIVE', 'NEUTRAL', 'REFLECTIVE', 'EXHAUSTED'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition ${
                        mood === m
                          ? 'bg-[#ff3d00]/30 text-[#ff8a1f] border-[#ff8a1f]/60 shadow-lg shadow-orange-950/50'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Entry Textarea */}
              <div>
                <label className="text-xs font-mono text-white/50 block mb-1.5">DAILY RAW TELEMETRY</label>
                <textarea
                  rows={4}
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="What happened today? What was built? Where did energy flow? What felt high leverage?"
                  required
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/40 text-sm focus:border-[#ff8a1f] focus:outline-none"
                />
              </div>

              {/* Structured Reflection Anchors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="text-emerald-400 block mb-1">Key Win</label>
                  <input
                    type="text"
                    value={win}
                    onChange={(e) => setWin(e.target.value)}
                    placeholder="e.g. Scaled ROAS to 4.2x"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#ff8a1f] block mb-1">Key Lesson</label>
                  <input
                    type="text"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="e.g. Direct calls save 3 days"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white focus:border-[#ff8a1f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-amber-300 block mb-1 text-xs font-mono">Strategic Decision Made</label>
                <input
                  type="text"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="e.g. Set minimum supplier quality threshold at 280 GSM"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:border-amber-300 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono text-[#ff8a1f]">+60 Discipline XP on Save</span>
                <button
                  type="submit"
                  className="btn btn--flame !py-2 !px-5 text-xs font-bold"
                >
                  <Sparkles className="w-4 h-4" /> Save Journal Entry
                </button>
              </div>

              {isSaved && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Journal logged and synthesized into neural memory vault (+60 XP)!
                </div>
              )}
            </form>
          </div>

          {/* Right: Past Entries History */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <Calendar className="w-4 h-4 text-[#ff8a1f]" /> Journal Vault Records
            </h3>

            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl space-y-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/50">{entry.date}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ff3d00]/20 text-[#ff8a1f] border border-[#ff3d00]/30">
                      {entry.mood}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">{entry.rawContent}</p>

                  {entry.wins.length > 0 && (
                    <div className="text-xs font-mono text-emerald-400">
                      ✓ Win: {entry.wins.join(', ')}
                    </div>
                  )}

                  {entry.lessons.length > 0 && (
                    <div className="text-xs font-mono text-[#ff8a1f]">
                      ★ Lesson: {entry.lessons.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
