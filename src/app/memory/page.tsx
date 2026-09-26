'use client';

import React, { useState } from 'react';
import { HardDrive, Search, Plus, X, AlertCircle } from 'lucide-react';
import MemoryCard from '@/components/mentra/MemoryCard';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { MemoryType } from '@/types/mentra';

export default function MemoryPage() {
  const { user } = useAuth();
  const { memories, syncUserDatabase } = useMentraStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('DECISION');
  const [importance, setImportance] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = memories.filter(item => {
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/memories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          type,
          importance,
          tags: tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Memory was not saved.');
      await syncUserDatabase(user.id);
      setTitle(''); setContent(''); setTagsInput(''); setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Memory was not saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div><div className="text-xs font-mono text-mentra-amber tracking-widest">VERIFIED MEMORY VAULT</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Memory</h1></div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold"><Plus className="w-4 h-4" />STORE MEMORY</button>
      </div>

      {error && <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your stored memories…" className="w-full bg-black/60 border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-white" /></div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-black/40 text-center"><HardDrive className="w-10 h-10 mx-auto text-white/25" /><p className="mt-3 text-sm text-white/50">{memories.length === 0 ? 'No verified memories stored yet.' : 'No matching memories.'}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(item => <MemoryCard key={item.id} memory={item} />)}</div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={save} className="w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold text-white">Store verified memory</h2><button type="button" onClick={() => setOpen(false)}><X className="w-5 h-5 text-white/50" /></button></div>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} placeholder="What should MENTRA remember?" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
            <div className="grid grid-cols-2 gap-3">
              <select value={type} onChange={e => setType(e.target.value as MemoryType)} className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs"><option>DECISION</option><option>IDEA</option><option>PROJECT</option><option>PEOPLE</option><option>USER_PREFERENCE</option></select>
              <select value={importance} onChange={e => setImportance(e.target.value as 'HIGH'|'MEDIUM'|'LOW')} className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs"><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
            </div>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags, comma separated" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            <button disabled={saving} className="w-full py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save to database'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
