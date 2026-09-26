'use client';

import React, { useState } from 'react';
import { BookOpen, Sparkles, Send, Calendar, Check, Brain, Tag, Smile, Meh, Frown, Zap, CheckSquare, ArrowRight } from 'lucide-react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { JournalEntry } from '@/types/mentra';

export default function JournalPage() {
  const { journalEntries, addJournalEntry } = useMentraStore();
  const [content, setContent] = useState('');
  const [wins, setWins] = useState('');
  const [problems, setProblems] = useState('');
  const [decisions, setDecisions] = useState('');
  const [ideas, setIdeas] = useState('');
  const [lessons, setLessons] = useState('');
  const [tomorrowActions, setTomorrowActions] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('PEAK');
  const [convertToMemories, setConvertToMemories] = useState(true);
  const [convertActionsToQuests, setConvertActionsToQuests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const winsArray = wins ? wins.split('\n').map(s => s.trim()).filter(Boolean) : ['Executed daily focus protocol'];
      const problemsArray = problems ? problems.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const decisionsArray = decisions ? decisions.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const ideasArray = ideas ? ideas.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const lessonsArray = lessons ? lessons.split('\n').map(s => s.trim()).filter(Boolean) : ['Consistent reflection preserves clarity'];
      const actionsArray = tomorrowActions ? tomorrowActions.split('\n').map(s => s.trim()).filter(Boolean) : ['Review weekly agent throughput'];

      const res = await fetch('/api/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mood,
          wins: winsArray,
          problems: problemsArray,
          decisions: decisionsArray,
          ideas: ideasArray,
          lessons: lessonsArray,
          tomorrowActions: actionsArray,
          tags: ['DailyLog', 'Reflection'],
          convertToMemories,
          convertActionsToQuests
        })
      });

      const data = await res.json();
      if (data.success && data.entry) {
        addJournalEntry(data.entry);
      } else {
        // Local fallback
        addJournalEntry({
          rawContent: content,
          summary: content.slice(0, 120) + (content.length > 120 ? '...' : ''),
          wins: winsArray,
          problems: problemsArray,
          decisions: decisionsArray,
          ideas: ideasArray,
          lessons: lessonsArray,
          tomorrowActions: actionsArray,
          mood,
          tags: ['DailyLog', 'Reflection']
        });
      }

      setContent('');
      setWins('');
      setProblems('');
      setDecisions('');
      setIdeas('');
      setLessons('');
      setTomorrowActions('');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      console.error('Failed to submit journal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-mentra-orange" />
            <span>DAILY NEURAL REFLECTION</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Operator Daily Journal
          </h1>
        </div>

        <div className="text-xs font-mono text-white/50">
          LOG ENTRIES: <strong className="text-mentra-amber">{journalEntries.length}</strong>
        </div>
      </div>

      {/* Writing Pad */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mood Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <span className="text-xs font-mono text-white/50 uppercase">ENERGY VALENCE / MOOD</span>
            <div className="flex items-center gap-2">
              {(['PEAK', 'PRODUCTIVE', 'NEUTRAL', 'EXHAUSTED', 'REFLECTIVE'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
                    mood === m
                      ? 'bg-mentra-orange text-white shadow-[0_0_10px_#5b6cff]'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Stream of Consciousness */}
          <div>
            <label className="block text-[11px] font-mono text-white/50 mb-2">
              STREAM OF CONSCIOUSNESS // WHAT HAPPENED TODAY?
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Reflect on key wins, bottlenecks, strategic decisions, and emotional focus..."
              className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none transition-all resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Structured Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-emerald-400 mb-1">
                TODAY&apos;S WINS (1 PER LINE)
              </label>
              <textarea
                rows={2}
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="e.g. Completed 60s speech practice with zero filler words..."
                className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-rose-400 mb-1">
                BOTTLENECKS / PROBLEMS (1 PER LINE)
              </label>
              <textarea
                rows={2}
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                placeholder="e.g. Speaking rate rushed above 160 WPM under adrenaline..."
                className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-mentra-amber mb-1">
                STRATEGIC DECISIONS (1 PER LINE)
              </label>
              <textarea
                rows={2}
                value={decisions}
                onChange={(e) => setDecisions(e.target.value)}
                placeholder="e.g. Will use PREP framework on tomorrow's team sync..."
                className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-cyan-400 mb-1">
                TOMORROW&apos;S PRIORITY ACTIONS (1 PER LINE)
              </label>
              <textarea
                rows={2}
                value={tomorrowActions}
                onChange={(e) => setTomorrowActions(e.target.value)}
                placeholder="e.g. Complete 5-minute live rehearsal presentation..."
                className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Conversions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 gap-3 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={convertToMemories}
                onChange={(e) => setConvertToMemories(e.target.checked)}
                className="rounded accent-mentra-orange w-4 h-4"
              />
              <span>Convert Decisions & Ideas → Memory Vault</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={convertActionsToQuests}
                onChange={(e) => setConvertActionsToQuests(e.target.checked)}
                className="rounded accent-mentra-orange w-4 h-4"
              />
              <span>Convert Tomorrow Actions → Daily Quests</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-white/40">
              AWARD: <strong className="text-mentra-amber">+60 XP</strong> &amp; <strong className="text-emerald-400">Discipline +2</strong>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(91,108,255,0.4)] hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'LOGGING...' : 'SAVE JOURNAL & CLAIM XP'}</span>
            </button>
          </div>

          {isSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center animate-in fade-in">
              ✓ Reflection securely committed to neural database! XP awarded.
            </div>
          )}
        </form>
      </div>

      {/* Recent Journal History */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono text-white/50 uppercase tracking-widest">
          RECENT JOURNAL CHRONICLE
        </h3>

        <div className="space-y-4">
          {journalEntries.map(entry => (
            <div key={entry.id} className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-mentra-amber font-bold">
                  {entry.entry_date || entry.date}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                  MOOD: {entry.mood}
                </span>
              </div>

              <p className="text-sm text-white/90 font-sans leading-relaxed">
                {entry.rawContent || entry.content}
              </p>

              {entry.wins && entry.wins.length > 0 && (
                <div className="text-xs font-mono text-emerald-400">
                  Wins: {entry.wins.join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
