'use client';

import React from 'react';
import { MemoryItem } from '@/types/mentra';

interface MemoryCardProps {
  memory: MemoryItem;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all flex flex-col justify-between space-y-3 shadow-xl">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
            {memory.type}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {memory.source}
          </span>
        </div>

        <h4 className="text-sm font-bold text-white mb-1">{memory.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">{memory.content}</p>
      </div>

      <div className="pt-2.5 border-t border-white/10 flex flex-wrap gap-1">
        {memory.tags.map((tag, idx) => (
          <span
            key={idx}
            className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
