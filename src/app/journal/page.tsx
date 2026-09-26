'use client';

import React, { useState } from 'react';
import { BookOpen, Send, AlertCircle } from 'lucide-react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { JournalEntry } from '@/types/mentra';

const lines = (value: string) => value.split('\n').map(v => v.trim()).filter(Boolean);

export default function JournalPage() {
  const { user } = useAuth();
  const { journalEntries, syncUserDatabase } = useMentraStore();
  const [content, setContent] = useState('');
  const [wins, setWins] = useState('');
  const [problems, setProblems] = useState('');
  const [decisions, setDecisions] = useState('');
  const [ideas, setIdeas] = useState('');
  const [lessons, setLessons] = useState('');
  const [tomorrowActions, setTomorrowActions] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('NEUTRAL');
  const [convertToMemories, setConvertToMemories] = useState(true);
  const [convertActionsToQuests, setConvertActionsToQuests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !content.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mood,
          wins: lines(wins),
          problems: lines(problems),
          decisions: lines(decisions),
          ideas: lines(ideas),
          lessons: lines(lessons),
          tomorrowActions: lines(tomorrowActions),
          tags: ['DailyLog', 'Reflection'],
          convertToMemories,
          convertActionsToQuests
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Journal entry was not saved.');

      await syncUserDatabase(user.id);
      setContent(''); setWins(''); setProblems(''); setDecisions(''); setIdeas(''); setLessons(''); setTomorrowActions('');
      setMessage({ ok: true, text: 'Journal saved to the database.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Journal entry was not saved.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
      <div className="border-b border-white/10 pb-4"><div className="text-xs font-mono tracking-widest text-mentra-amber">VERIFIED REFLECTION LOG</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Journal</h1></div>

      {message && <div className={`p-4 rounded-xl border text-sm ${message.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'}`}><div className="flex gap-2"><AlertCircle className="w-4 h-4" />{message.text}</div></div>}

      <form onSubmit={submit} className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-black/55 space-y-5">
        <div className="flex flex-wrap gap-2">{(['PEAK','PRODUCTIVE','NEUTRAL','EXHAUSTED','REFLECTIVE'] as const).map(item => <button type="button" key={item} onClick={() => setMood(item)} className={`px-3 py-1.5 rounded-full text-[11px] font-mono ${mood === item ? 'bg-mentra-orange text-white' : 'bg-white/5 text-white/55'}`}>{item}</button>)}</div>
        <textarea required value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="What actually happened today?" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white" />
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Wins" value={wins} set={setWins} />
          <Field label="Problems" value={problems} set={setProblems} />
          <Field label="Decisions" value={decisions} set={setDecisions} />
          <Field label="Ideas" value={ideas} set={setIdeas} />
          <Field label="Lessons" value={lessons} set={setLessons} />
          <Field label="Tomorrow actions" value={tomorrowActions} set={setTomorrowActions} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 text-xs text-white/70">
          <label className="flex gap-2"><input type="checkbox" checked={convertToMemories} onChange={e => setConvertToMemories(e.target.checked)} />Convert entered decisions/ideas to memory</label>
          <label className="flex gap-2"><input type="checkbox" checked={convertActionsToQuests} onChange={e => setConvertActionsToQuests(e.target.checked)} />Convert entered tomorrow actions to quests</label>
        </div>
        <button disabled={saving || !content.trim()} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-40"><Send className="w-4 h-4" />{saving ? 'Saving…' : 'Save journal'}</button>
      </form>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-white/40">Recent entries</h2>
        {journalEntries.length === 0 ? <div className="p-8 rounded-2xl border border-white/10 text-center text-white/45">No journal entries stored yet.</div> : journalEntries.map(entry => <div key={entry.id} className="p-5 rounded-2xl border border-white/10 bg-black/40"><div className="text-[11px] text-mentra-amber">{entry.date}</div><p className="mt-2 text-sm text-white/85 whitespace-pre-wrap">{entry.rawContent}</p></div>)}
      </div>
    </div>
  );
}

function Field({ label, value, set }: { label: string; value: string; set: (value: string) => void }) {
  return <label className="block"><span className="text-[10px] font-mono uppercase text-white/45">{label} — one per line</span><textarea rows={2} value={value} onChange={e => set(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs" /></label>;
}
