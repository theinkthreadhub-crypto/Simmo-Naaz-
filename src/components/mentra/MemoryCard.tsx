'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { MemoryItem } from '@/types/mentra';

interface MemoryCardProps {
  memory: MemoryItem;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <article className="rounded-[18px] border border-[#292F3B] bg-[#161A22] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#292F3B] bg-[#10131A] px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.1em] text-[#A1A8B5]">
            {memory.type.replaceAll('_', ' ')}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.1em] ${
            memory.importance === 'HIGH'
              ? 'border-[#B7FF3C]/30 bg-[#B7FF3C]/10 text-[#B7FF3C]'
              : 'border-[#292F3B] bg-[#10131A] text-[#697181]'
          }`}>
            {memory.importance}
          </span>
        </div>
        <Bookmark className="h-4 w-4 shrink-0 text-[#697181]" />
      </div>

      <div>
        <h3 className="text-lg uppercase">{memory.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#A1A8B5]">{memory.content}</p>
      </div>

      <div className="border-t border-[#292F3B] pt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#697181]">
          Source: {memory.source || 'Direct entry'}
        </div>
        {memory.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-[#10131A] px-2 py-1 text-[10px] text-[#A1A8B5]">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
