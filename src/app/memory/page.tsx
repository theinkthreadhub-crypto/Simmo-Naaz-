'use client';

import React, { useState } from 'react';
import { HardDrive, Search, Plus, Tag, Sparkles, Filter, X } from 'lucide-react';
import MemoryCard from '@/components/mentra/MemoryCard';
import { useMentraStore } from '@/lib/store/mentraStore';
import { MemoryItem, MemoryType } from '@/types/mentra';

export default function MemoryPage() {
  const { memories, addMemory } = useMentraStore();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('DECISION');
  const [importance, setImportance] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [tagsInput, setTagsInput] = useState('');

  // Extract all unique tags
  const allTags = Array.from(new Set(memories.flatMap(m => m.tags || [])));

  const filteredMemories = memories.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? m.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addMemory({
      title,
      content,
      type,
      importance,
      source: 'Operator Direct Ingestion',
      tags: tagsInput ? tagsInput.split(',').map(s => s.trim()) : ['ManualAnchor']
    });

    setTitle('');
    setContent('');
    setTagsInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <HardDrive className="w-4 h-4 text-mentra-orange" />
            <span>SECOND BRAIN NEURAL VAULT</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Memory & Knowledge Vault
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>STORE NEURAL ANCHOR</span>
        </button>
      </div>

      {/* Instant Search & Tag Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search strategic decisions, principles, suppliers, ideas..."
            className="w-full bg-black/60 border border-white/15 focus:border-mentra-orange rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-all glass-panel"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-white/40 flex-shrink-0">TAGS:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-[11px] transition-all flex-shrink-0 ${
                selectedTag === null ? 'bg-mentra-orange text-white' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              ALL
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-[11px] transition-all flex-shrink-0 ${
                  selectedTag === tag ? 'bg-mentra-orange text-white shadow-[0_0_8px_#ff4a00]' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map(mem => (
          <MemoryCard key={mem.id} memory={mem} />
        ))}
      </div>

      {/* Store Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel-orange bg-black/90 border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-mentra-orange" />
                <span>STORE NEURAL ANCHOR</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">ANCHOR TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Brand GSM Quality Standard"
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">CORE CONTENT / PRINCIPLE</label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="The timeless principle, supplier contact info, or decision context..."
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">TYPE</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MemoryType)}
                    className="w-full bg-[#180703] border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="DECISION">DECISION</option>
                    <option value="IDEA">IDEA</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="PEOPLE">PEOPLE</option>
                    <option value="USER_PREFERENCE">PREFERENCE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">IMPORTANCE</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                    className="w-full bg-[#180703] border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="HIGH">HIGH PRIORITY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Brand, SupplyChain, Quality"
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,74,0,0.4)]"
                >
                  <span>SAVE TO VAULT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
