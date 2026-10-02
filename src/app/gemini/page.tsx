'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, RotateCcw, Zap, ShoppingBag, TrendingUp, Share2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: ShoppingBag, text: 'Best trending products for Myntra/Meesho?', label: 'Product Hunt' },
  { icon: TrendingUp, text: 'Mera Instagram grow kaise karu fashion niche mein?', label: 'Growth' },
  { icon: Share2, text: 'Viral UGC reel ideas for my fashion brand', label: 'UGC Ideas' },
  { icon: Zap, text: 'Facebook ads ke liye best budget strategy?', label: 'Ads' },
];

export default function GeminiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '⚡ MENTRA AI — Powered by Google Gemini\n\nNamaste! Main aapka AI business partner hoon. Fashion, e-commerce, social media marketing — kuch bhi poocho. Main hoon na! 🚀',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build history (exclude welcome)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history })
      });

      const data = await res.json();

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.reply || '⚠️ Response nahi mili. Please dobara try karo.',
        timestamp: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection error. Internet check karo aur dobara try karo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{
      id: 'welcome_new',
      role: 'assistant',
      content: '⚡ Naya session shuru! Kya poocha hai aapko?',
      timestamp: new Date()
    }]);
    inputRef.current?.focus();
  };

  const formatContent = (text: string) => {
    // Basic markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-xs">$1</code>')
      .split('\n')
      .map((line, i) => `<span key="${i}">${line || '&nbsp;'}</span>`)
      .join('<br/>');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col" style={{ fontFamily: "'Playfair Display', 'Inter', serif" }}>
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d15]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-sm">MENTRA AI</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-mono">
                  Gemini Flash
                </span>
              </div>
              <p className="text-white/40 text-[11px] font-mono">Fashion • E-Commerce • Growth</p>
            </div>
          </div>

          <button
            onClick={resetChat}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-all"
            title="New Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4 overflow-y-auto">
        
        {/* Quick Prompts — show only at start */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt.text)}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/40 transition-all text-left group"
              >
                <prompt.icon className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-violet-400 font-mono mb-0.5">{prompt.label}</div>
                  <div className="text-white/70 text-xs leading-snug group-hover:text-white/90 transition-colors">
                    {prompt.text}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
            }`}>
              {msg.role === 'user' ? 'U' : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white/8 border border-white/10 text-white/90 rounded-tl-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              <span className="text-white/25 text-[10px] font-mono px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                  />
                ))}
              </div>
              <span className="text-white/40 text-xs font-mono">Gemini thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-[#0d0d15]/80 backdrop-blur-xl sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end bg-white/5 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-violet-500/50 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kuch bhi poocho — product hunt, ads, UGC, finance..."
              rows={1}
              className="flex-1 bg-transparent text-white/90 text-sm placeholder:text-white/25 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
              style={{ minHeight: '24px' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/20 text-[10px] font-mono text-center mt-2">
            Powered by Google Gemini Flash • Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .bg-white\\/8 { background-color: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
