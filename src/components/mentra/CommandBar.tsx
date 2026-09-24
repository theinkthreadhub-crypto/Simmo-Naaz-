'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import { Mic, Send, Sparkles, X, Terminal, Cpu } from 'lucide-react';

const SUGGESTIONS = [
  '₹500 Meta Ads expense add karo',
  'MENTRA, aaj mujhe kya karna hai?',
  'Mujhe Python seekhna hai',
  'What do you remember about InkThread?',
  'Save journal: Completed supplier negotiations successfully',
];

export default function CommandBar() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const executeCommand = useMentraStore((state) => state.executeCommand);
  const activeResponse = useMentraStore((state) => state.activeCommandResponse);
  const clearResponse = useMentraStore((state) => state.clearCommandResponse);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (sug: string) => {
    setInput(sug);
    executeCommand(sug);
    setShowSuggestions(false);
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInput('₹500 Meta Ads expense add karo');
        setIsListening(false);
      }, 2400);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 z-30 relative">
      {/* Response Box Modal / Alert */}
      {activeResponse && (
        <div className="mb-3 p-4 rounded-2xl bg-[#1e0903]/90 border border-[#ff8a1f]/50 shadow-2xl shadow-orange-950/50 backdrop-blur-xl flex items-start justify-between animate-rise">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#ff3d00]/30 to-[#ff8a1f]/20 border border-[#ff3d00]/40 text-[#ff8a1f] mt-0.5">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#ff8a1f] font-semibold mb-1 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#ff3d00] animate-ping" />
                MENTRA TELEMETRY DISPATCH
              </div>
              <p className="text-sm text-slate-100 font-sans leading-relaxed">{activeResponse}</p>
            </div>
          </div>
          <button
            onClick={clearResponse}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Command Input */}
      <div className="relative group">
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-3 bg-[rgba(34,12,3,0.72)] border ${
            isListening ? 'border-[#ff8a1f] ring-2 ring-[#ff3d00]/40' : 'border-white/15 group-hover:border-[#ff8a1f]/60'
          } rounded-full px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300`}
        >
          <div className="text-[#ff8a1f] p-1">
            <Terminal className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={isListening ? 'Listening to operator voice...' : 'Ask MENTRA anything... (Quests, Finance, Skills, Memory, Agents)'}
            className="w-full bg-transparent text-slate-100 placeholder-white/40 text-sm md:text-base focus:outline-none"
          />

          {/* Voice Mic Toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded-full transition-all ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
            }`}
            title={isListening ? 'Stop Listening' : 'Voice Input'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn btn--flame !p-2.5 !px-4 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3.5 bg-[#1a0701]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-wrap gap-2">
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-white/50 mb-1 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#ff8a1f]" /> QUICK PROTOCOLS:
              </span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="hover:text-white"
              >
                Close
              </button>
            </div>
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="text-xs bg-white/5 hover:bg-[#ff3d00]/20 hover:text-[#ff8a1f] hover:border-[#ff8a1f]/50 text-slate-300 px-3.5 py-1.5 rounded-full border border-white/10 transition text-left"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
