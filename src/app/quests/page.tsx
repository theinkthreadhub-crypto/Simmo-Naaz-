'use client';

import React, { useState } from 'react';
import { Plus, Sword, X, AlertCircle } from 'lucide-react';
import QuestCard from '@/components/quests/QuestCard';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { QuestCategory, QuestDifficulty, QuestType } from '@/types/mentra';

export default function QuestsPage() {
  const { user } = useAuth();
  const { quests, syncUserDatabase } = useMentraStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('BUSINESS');
  const [type, setType] = useState<QuestType>('DAILY');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/quests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          difficulty,
          due_date: dueDate || null
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Quest was not created.');
      await syncUserDatabase(user.id);
      setTitle(''); setDescription(''); setDueDate(''); setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quest was not created.');
    } finally {
      setSaving(false);
    }
  };

  const active = quests.filter(q => q.status === 'ACTIVE');
  const completed = quests.filter(q => q.status === 'COMPLETED');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div><div className="text-xs font-mono text-mentra-amber tracking-widest">DATABASE MISSIONS</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Quests</h1></div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold"><Plus className="w-4 h-4" />CREATE QUEST</button>
      </div>

      {error && <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <section className="space-y-3"><h2 className="text-xs font-mono uppercase tracking-widest text-white/45">Active ({active.length})</h2>{active.length === 0 ? <Empty text="No active quests stored." /> : active.map(q => <QuestCard key={q.id} quest={q} onComplete={() => user?.id ? syncUserDatabase(user.id) : undefined} />)}</section>
      {completed.length > 0 && <section className="space-y-3"><h2 className="text-xs font-mono uppercase tracking-widest text-white/45">Completed ({completed.length})</h2>{completed.slice(0,10).map(q => <QuestCard key={q.id} quest={q} />)}</section>}

      {open && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><form onSubmit={createQuest} className="w-full max-w-lg rounded-3xl bg-neutral-950 border border-white/15 p-6 space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">Create real quest</h2><button type="button" onClick={() => setOpen(false)}><X className="w-5 h-5 text-white/50" /></button></div>
        <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Quest title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
        <div className="grid grid-cols-3 gap-2">
          <select value={category} onChange={e=>setCategory(e.target.value as QuestCategory)} className="bg-neutral-900 border border-white/10 rounded-xl p-2 text-white text-xs">{['BUSINESS','FINANCE','FITNESS','LEARNING','PERSONAL_GROWTH','DISCIPLINE','COMMUNICATION'].map(x=><option key={x}>{x}</option>)}</select>
          <select value={type} onChange={e=>setType(e.target.value as QuestType)} className="bg-neutral-900 border border-white/10 rounded-xl p-2 text-white text-xs">{['DAILY','MAIN','SIDE','WEEKLY','BOSS','RECOVERY','LEARNING','PRACTICE'].map(x=><option key={x}>{x}</option>)}</select>
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value as QuestDifficulty)} className="bg-neutral-900 border border-white/10 rounded-xl p-2 text-white text-xs">{['EASY','MEDIUM','HARD','EPIC','ELITE','BOSS'].map(x=><option key={x}>{x}</option>)}</select>
        </div>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white" />
        <button disabled={saving} className="w-full py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Create quest'}</button>
      </form></div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-10 rounded-3xl border border-white/10 bg-black/40 text-center"><Sword className="w-9 h-9 mx-auto text-white/20" /><p className="mt-3 text-sm text-white/45">{text}</p></div>;
}
