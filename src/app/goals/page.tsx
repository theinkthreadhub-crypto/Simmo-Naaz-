'use client';

import React, { useState } from 'react';
import { Target, Plus, Calendar, CheckCircle2, Circle, X, AlertCircle } from 'lucide-react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { QuestCategory } from '@/types/mentra';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, syncUserDatabase } = useMentraStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('BUSINESS');
  const [targetDate, setTargetDate] = useState('');
  const [milestones, setMilestones] = useState('');
  const [saving, setSaving] = useState(false);
  const [workingMilestone, setWorkingMilestone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !title.trim()) return;
    setSaving(true); setError(null);
    try {
      const milestoneRows = milestones.split('\n').map(v => v.trim()).filter(Boolean).map(title => ({ title }));
      const response = await fetch('/api/goals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          target_date: targetDate || null,
          milestones: milestoneRows
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Goal was not created.');
      await syncUserDatabase(user.id);
      setTitle(''); setDescription(''); setTargetDate(''); setMilestones(''); setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Goal was not created.'); }
    finally { setSaving(false); }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!user?.id) return;
    setWorkingMilestone(milestoneId); setError(null);
    try {
      const response = await fetch('/api/goals/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, completed: !completed })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Milestone was not updated.');
      await syncUserDatabase(user.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Milestone was not updated.'); }
    finally { setWorkingMilestone(null); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest">PERSISTED OBJECTIVES</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Goals</h1></div><button onClick={()=>setOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold"><Plus className="w-4 h-4" />CREATE GOAL</button></div>
      {error && <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {goals.length === 0 ? <div className="p-12 text-center rounded-3xl border border-white/10 bg-black/40"><Target className="w-10 h-10 mx-auto text-white/20" /><p className="mt-3 text-sm text-white/45">No goals stored yet.</p></div> : goals.map(goal => <div key={goal.id} className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-black/55 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><div className="text-[10px] text-mentra-amber">{goal.category}</div><h2 className="text-xl font-bold text-white mt-1">{goal.title}</h2><p className="text-sm text-white/55 mt-1">{goal.description}</p></div><div className="text-right"><div className="text-2xl font-mono text-mentra-amber font-bold">{goal.progressPercent}%</div><div className="text-[10px] text-white/35">{goal.status}</div></div></div>
        {(goal.target_date || goal.targetDate) && <div className="text-xs text-white/45 flex gap-1.5"><Calendar className="w-3.5 h-3.5" />Target: {goal.target_date || goal.targetDate}</div>}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-mentra-orange" style={{width:`${goal.progressPercent}%`}} /></div>
        <div className="grid md:grid-cols-2 gap-2">{goal.milestones.length === 0 ? <div className="text-xs text-white/35">No milestones defined.</div> : goal.milestones.map(m => <button key={m.id} disabled={workingMilestone===m.id} onClick={()=>toggleMilestone(m.id,m.completed)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-left flex items-center gap-2 disabled:opacity-50">{m.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-white/30" />}<span className={`text-xs ${m.completed ? 'text-white/45 line-through':'text-white/80'}`}>{m.title}</span></button>)}</div>
      </div>)}
      {open && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><form onSubmit={create} className="w-full max-w-lg rounded-3xl bg-neutral-950 border border-white/15 p-6 space-y-4"><div className="flex justify-between"><h2 className="font-bold text-white">Create goal</h2><button type="button" onClick={()=>setOpen(false)}><X className="w-5 h-5 text-white/50" /></button></div><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Goal title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"/><div className="grid grid-cols-2 gap-3"><select value={category} onChange={e=>setCategory(e.target.value as QuestCategory)} className="bg-neutral-900 border border-white/10 rounded-xl p-3 text-white text-xs">{['BUSINESS','FINANCE','FITNESS','LEARNING','PERSONAL_GROWTH','DISCIPLINE','COMMUNICATION'].map(x=><option key={x}>{x}</option>)}</select><input type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)} className="bg-neutral-900 border border-white/10 rounded-xl p-3 text-white"/></div><textarea value={milestones} onChange={e=>setMilestones(e.target.value)} rows={4} placeholder="Milestones — one per line. Leave blank for no auto-created fake milestones." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs"/><button disabled={saving} className="w-full py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-50">{saving?'Saving…':'Create goal'}</button></form></div>}
    </div>
  );
}
