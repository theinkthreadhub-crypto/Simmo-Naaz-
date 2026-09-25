'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mic, MicOff, Sparkles, CornerDownLeft, X, Bot, ArrowRight, CheckCircle2 } from 'lucide-react';
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
          pageContext: pathname ? pathname.replace('/', '') : 'command_bar'
        })
      });

      const data = await res.json();
      setResponseMessage(data.message || 'Command executed successfully.');
      if (data.cards && data.cards.length > 0) {
        setResponseCards(data.cards);
      }

      // Sync state if finance/quest tools were used
      if (user?.id) {
        syncUserDatabase(user.id);
      }
    } catch (err: any) {
      setResponseMessage(`Error: ${err.message || 'Could not reach MENTRA Core.'}`);
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
    '₹450 Meta Ads expense add karo',
    'Aaj mujhe kya karna chahiye?',
    'Public speaking practice start karo',
    'Kal product upload karne ka quest banao',
    'Maine ads ke bare me last kya decide kiya tha?'
  ];

  return (
    <div className="w-full relative space-y-3">
      <div className="glass-panel-orange p-3 sm:p-4 bg-black/60 border-white/10 shadow-2xl relative overflow-hidden rounded-3xl">
        {/* Glow corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-mentra-orange/10 rounded-full blur-2xl pointer-events-none" />

        <form onSubmit={handleSend} className="relative flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-mentra-amber flex-shrink-0">
            <Bot className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? 'Listening to voice memo...' : isExecuting ? 'Executing command via MENTRA AI Core...' : 'Ask MENTRA anything... (/quest, /finance, /skills, /journal)'}
            className={`w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none font-sans ${
              isListening ? 'animate-pulse text-mentra-amber' : ''
            }`}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-mentra-orange text-white shadow-[0_0_12px_#ff4a00]' 
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={isExecuting || !query.trim()}
              className="p-2 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white shadow-[0_0_15px_rgba(255,74,0,0.4)] hover:opacity-90 disabled:opacity-30 transition-all"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] font-mono text-white/40">
          <span className="flex-shrink-0 flex items-center gap-1 text-mentra-amber">
            <Sparkles className="w-3 h-3 text-mentra-orange" />
            <span>TRY:</span>
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(s)}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Intelligence Result Toast / Card */}
      {responseMessage && (
        <div className="p-4 rounded-2xl bg-neutral-950 border border-mentra-orange/40 shadow-2xl space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-mentra-amber uppercase font-bold">
              <Bot className="w-4 h-4 text-mentra-orange" />
              <span>MENTRA INTELLIGENCE DISPATCH</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/mentra')}
                className="text-[11px] font-mono text-white/60 hover:text-mentra-amber flex items-center gap-1 transition-colors"
              >
                <span>OPEN CHAT</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setResponseMessage(null); setResponseCards([]); }}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-white/90 font-mono leading-relaxed">
            {responseMessage}
          </p>

          {/* Action Cards */}
          {responseCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
              {responseCards.map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                  <div className="font-bold text-white text-[11px]">{c.title}</div>
                  {c.subtitle && <div className="text-[10px] text-white/60 mt-0.5">{c.subtitle}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
