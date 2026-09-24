'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { MemoryType } from '@/types/mentra';
import {
  Brain,
  Search,
  Plus,
  Tag,
  Calendar,
  Sparkles,
  Layers,
  Bookmark,
  CheckCircle2
} from 'lucide-react';

export default function MemoryPage() {
  const memories = useMentraStore((state) => state.memories);
  const addMemory = useMentraStore((state) => state.addMemory);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('DECISION');
  const [source, setSource] = useState('Manual Entry');
  const [tagsInput, setTagsInput] = useState('');

  const filteredMemories = memories.filter((mem) => {
    if (selectedType !== 'ALL' && mem.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        mem.title.toLowerCase().includes(q) ||
        mem.content.toLowerCase().includes(q) ||
        mem.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    addMemory({
      title,
      content,
      type,
      source,
      importance: 'HIGH',
      tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : ['Strategic']
    });
    setTitle('');
    setContent('');
    setTagsInput('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Brain className="w-4 h-4" /> MENTRA SECOND BRAIN
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Neural Memory Vault</h1>
            <p className="text-slate-400 text-sm mt-1">
              Long-term synthesized memory of core principles, past decisions, project briefs, and personal operating frameworks.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Synthesize Memory
          </button>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-[#0d101a] border border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you remember? (e.g. InkThread, GSM, Ads)"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {['ALL', 'DECISION', 'PROJECT', 'IDEA', 'USER_PREFERENCE'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`text-xs font-mono px-3 py-1 rounded-lg border transition ${
                  selectedType === t
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-5 rounded-2xl bg-[#0d101a] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
                    {mem.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {mem.source}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{mem.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{mem.content}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                {mem.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Memory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0d101a] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white font-mono">Synthesize Memory Anchor</h3>

              <form onSubmit={handleCreateMemory} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Title / Anchor Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Core Margin Rule"
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Memory Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="DECISION">DECISION</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="IDEA">IDEA</option>
                    <option value="USER_PREFERENCE">USER_PREFERENCE</option>
                    <option value="PEOPLE">PEOPLE</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Content / Rule</label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe the permanent memory item, decision rationale, or operating preference..."
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Quality, Brand, Strategy"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-500/20 transition"
                  >
                    Save Memory Anchor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
