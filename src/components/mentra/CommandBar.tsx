'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight, Bot, CornerDownLeft, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { ActionCard } from '@/lib/ai/types';

export default function CommandBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { syncUserDatabase } = useMentraStore();

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [responseCards, setResponseCards] = useState<ActionCard[]>([]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isExecuting) return;

    const text = query.trim();
    setQuery('');
    setIsExecuting(true);
    setResponseMessage(null);
    setResponseCards([]);

    try {
      const res = await fetch('/api/mentra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          pageContext: pathname ? pathname.replace('/', '') : 'command_bar',
        }),
      });

      const data = await res.json();
      setResponseMessage(data.message || 'Done.');
      if (data.cards?.length) setResponseCards(data.cards);

      if (user?.id) await syncUserDatabase(user.id);
    } catch (err: any) {
      setResponseMessage(`Could not reach MENTRA: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setQuery('₹450 Meta Ads expense add karo');
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const suggestions = [
    'Aaj mujhe kya karna chahiye?',
    '₹450 Meta Ads expense add karo',
    'Kal ke liye ek task banao',
    'Meri current priority kya hai?',
  ];

  return (
    <div className="w-full space-y-3">
      <form
        onSubmit={handleSend}
        className="rounded-2xl border border-[#292F3B] bg-[#161A22] p-2.5 sm:p-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 shrink-0 rounded-xl border border-[#B7FF3C]/25 bg-[#B7FF3C]/10 flex items-center justify-center text-[#B7FF3C]">
            <Bot className="h-[18px] w-[18px]" />
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? 'Listening...'
                : isExecuting
                  ? 'MENTRA is working...'
                  : 'Ask MENTRA anything...'
            }
            className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-sm text-[#F5F7FA] placeholder:text-[#697181] focus:outline-none"
          />

          <button
            type="button"
            onClick={toggleMic}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            className={`h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center ${
              isListening
                ? 'border-[#B7FF3C]/40 bg-[#B7FF3C]/10 text-[#B7FF3C]'
                : 'border-[#292F3B] bg-[#10131A] text-[#A1A8B5]'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            type="submit"
            disabled={isExecuting || !query.trim()}
            aria-label="Send to MENTRA"
            className="h-11 w-11 shrink-0 rounded-xl bg-[#B7FF3C] text-[#090B0F] flex items-center justify-center disabled:opacity-30"
          >
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          <div className="min-h-9 shrink-0 px-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">
            <Sparkles className="h-3 w-3 text-[#B7FF3C]" />
            Try
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="min-h-9 shrink-0 rounded-xl border border-[#292F3B] bg-[#10131A] px-3 text-xs text-[#A1A8B5] hover:text-[#F5F7FA]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      {responseMessage && (
        <div className="rounded-2xl border border-[#B7FF3C]/25 bg-[#161A22] p-4 sm:p-5 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#B7FF3C]">
                MENTRA
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#F5F7FA]">{responseMessage}</p>
            </div>
            <button
              onClick={() => {
                setResponseMessage(null);
                setResponseCards([]);
              }}
              aria-label="Close result"
              className="h-10 w-10 shrink-0 rounded-xl border border-[#292F3B] flex items-center justify-center text-[#697181]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {responseCards.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {responseCards.map((card, index) => (
                <div key={index} className="rounded-xl border border-[#292F3B] bg-[#10131A] p-3">
                  <div className="text-sm font-semibold">{card.title}</div>
                  {card.subtitle && <div className="mt-1 text-xs text-[#A1A8B5]">{card.subtitle}</div>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/mentra')}
            className="mt-4 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-[#B7FF3C]"
          >
            Open AI Mentor
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
