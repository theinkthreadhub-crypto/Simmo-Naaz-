'use client';

import React from 'react';
import { Tag, Calendar, Sparkles, Brain, Bookmark } from 'lucide-react';
import { MemoryItem } from '@/types/mentra';

interface MemoryCardProps {
  memory: MemoryItem;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const getImportanceBadge = () => {
    switch (memory.importance) {
      case 'HIGH':
        return 'text-mentra-orange border-mentra-orange/40 bg-mentra-orange/10';
      case 'MEDIUM':
        return 'text-mentra-amber border-mentra-amber/30 bg-mentra-amber/10';
      default:
        return 'text-white/50 border-white/10 bg-white/5';
    }
  };

  return (
    <div className="p-5 rounded-2xl glass-panel bg-black/60 border-white/10 hover:border-mentra-orange/40 transition-all space-y-3 relative overflow-hidden group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mentra-amber">
            {memory.type}
          </span>
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getImportanceBadge()}`}>
            {memory.importance} PRIORITY
          </span>
        </div>
        <Bookmark className="w-4 h-4 text-white/30 group-hover:text-mentra-amber transition-colors" />
      </div>

      <h3 className="text-base font-bold text-white font-display">
        {memory.title}
      </h3>

      <p className="text-xs text-white/70 leading-relaxed font-sans">
        {memory.content}
      </p>

      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/40">
        <span>SOURCE: {memory.source || 'Direct Entry'}</span>
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {memory.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/60">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
