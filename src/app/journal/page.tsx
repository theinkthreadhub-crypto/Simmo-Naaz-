'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
import { BookOpen, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <BookOpen className="w-4 h-4" /> MENTRA NEURAL JOURNAL
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Daily Reflection & Synthesis</h1>
            <p className="text-slate-400 text-sm mt-1">
              Log raw thoughts or voice memos. MENTRA synthesizes lessons, extracts permanent memory anchors, and rewards +60 XP.
            </p>
          </div>

          <CommandBar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <form
                onSubmit={handleSaveJournal}
                className="p-6 sm:p-8 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> NEW REFLECTION ENTRY
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">STATE OF MIND / MOOD</label>
                  <div className="flex flex-wrap gap-2">
                    {(['PEAK', 'PRODUCTIVE', 'NEUTRAL', 'REFLECTIVE', 'EXHAUSTED'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMood(m)}
                        className={`text-xs font-mono px-3.5 py-1.5 rounded-xl border transition ${
                          mood === m
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/20'
                            : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">DAILY RAW TELEMETRY</label>
                  <textarea
                    rows={4}
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    placeholder="What happened today? What was built? Where did energy flow? What felt high leverage?"
                    required
                    className="w-full p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-emerald-400 block mb-1">Key Win</label>
                    <input
                      type="text"
                      value={win}
                      onChange={(e) => setWin(e.target.value)}
                      placeholder="e.g. Scaled ROAS to 4.2x"
                      className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-amber-400 block mb-1">Key Lesson</label>
                    <input
                      type="text"
                      value={lesson}
                      onChange={(e) => setLesson(e.target.value)}
                      placeholder="e.g. Direct calls save 3 days"
                      className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-violet-400 block mb-1 text-xs font-mono">Strategic Decision Made</label>
                  <input
                    type="text"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    placeholder="e.g. Set minimum supplier quality threshold at 280 GSM"
                    className="w-full p-3 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs font-mono focus:border-violet-400 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400">+60 Discipline XP on Save</span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold text-xs shadow-md shadow-cyan-500/20 hover:opacity-90 transition flex items-center gap-1.5"
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

            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Calendar className="w-4 h-4 text-cyan-400" /> Journal Vault Records
              </h3>

              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-3 shadow-2xl"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{entry.date}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                        {entry.mood}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{entry.rawContent}</p>

                    {entry.wins.length > 0 && (
                      <div className="text-xs font-mono text-emerald-400">
                        ✓ Win: {entry.wins.join(', ')}
                      </div>
                    )}

                    {entry.lessons.length > 0 && (
                      <div className="text-xs font-mono text-amber-400">
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

      <MobileNav />
    </div>
  );
}
