'use client';

import React, { useState, useEffect } from 'react';
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
  const executeCommand = useMentraStore(state => state.executeCommand);
  const activeResponse = useMentraStore(state => state.activeCommandResponse);
  const clearResponse = useMentraStore(state => state.clearCommandResponse);

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
      // Simulate voice capture
      setTimeout(() => {
        setInput('₹500 Meta Ads expense add karo');
        setIsListening(false);
      }, 2400);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Response Box Modal / Alert */}
      {activeResponse && (
        <div className="mb-3 p-4 rounded-xl bg-[#0e1322]/90 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 backdrop-blur-md flex items-start justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                MENTRA Response Stream
              </div>
              <p className="text-sm text-slate-200 font-sans leading-relaxed">{activeResponse}</p>
            </div>
          </div>
          <button
            onClick={clearResponse}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Command Input */}
      <div className="relative group">
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-3 bg-[#0d101a]/95 border ${
            isListening ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800 group-hover:border-cyan-500/50'
          } rounded-2xl px-4 py-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300`}
        >
          <div className="text-cyan-400 p-1">
            <Terminal className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={isListening ? 'Listening to voice command...' : 'Ask MENTRA anything... (Commands, Quests, Finance, Journal, Memory)'}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base focus:outline-none"
          />

          {/* Voice Mic Toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
            }`}
            title={isListening ? 'Stop Listening' : 'Voice Input'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-md shadow-cyan-500/20 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#0d101a]/95 border border-slate-800/90 rounded-xl shadow-xl backdrop-blur-md z-30 flex flex-wrap gap-2">
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> SUGGESTED PROTOCOLS:
              </span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="hover:text-slate-200"
              >
                Close
              </button>
            </div>
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="text-xs bg-slate-800/70 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 transition text-left"
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
