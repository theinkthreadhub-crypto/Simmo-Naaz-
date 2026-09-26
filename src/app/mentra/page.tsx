'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Sword, 
  Brain, 
  Mic, 
  MessageSquare, 
  ChevronRight, 
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';
import { ActionCard, MentraConversation } from '@/lib/ai/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: ActionCard[];
  toolStatus?: string;
  timestamp: string;
}

export default function MentraChatPage() {
  const { user, profile, progress } = useAuth();
  const { player, quests, skills, finance, agents } = useMentraStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MentraConversation[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const activeSkill = skills[0];

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `[MENTRA CORE ONLINE]: Operator ${profile?.display_name || 'Naaz'}, all systems nominal. Level 0${displayLevel} Vanguard Architect active with ${activeQuests.length} scheduled quests. Standing by for voice or command dispatch.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Load past conversations
    async function loadConversations() {
      try {
        const res = await fetch('/api/mentra/conversations');
        const data = await res.json();
        if (data.conversations) {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.warn('Could not load conversations:', err);
      }
    }
    loadConversations();
  }, [profile?.display_name, displayLevel, activeQuests.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentToolStatus]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setCurrentToolStatus('PROCESSING_TELEMETRY');

    try {
      const res = await fetch('/api/mentra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationId: activeConversationId || undefined,
          pageContext: 'mentra_chat'
        })
      });

      const data = await res.json();

      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: data.message || '[Command Executed]',
        cards: data.cards || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If user added finance/quest/skill, sync local store
      if (data.toolCallsExecuted?.includes('addFinanceTransaction') || data.toolCallsExecuted?.includes('createQuest')) {
        if (user?.id) useMentraStore.getState().syncUserDatabase(user.id);
      }

    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `[MENTRA CORE]: System error executing command: ${err.message || 'Connection lost'}. Data integrity preserved.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setCurrentToolStatus(null);
    }
  };

  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: `msg_new_${Date.now()}`,
        role: 'assistant',
        content: `[MENTRA CORE]: New Intelligence Session initialized. How can I advance your operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const sampleCommands = [
    '₹450 Meta Ads expense add karo',
    'Aaj mujhe kya karna chahiye?',
    'Public speaking practice start karo',
    'Kal product upload karne ka quest banao',
    'Maine ads ke bare me last kya decide kiya tha?'
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-[88vh] flex flex-col animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-mentra-orange to-mentra-amber flex items-center justify-center text-white shadow-[0_0_15px_rgba(91,108,255,0.4)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-display text-white">MENTRA AI CORE</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                ONLINE • v4.0
              </span>
            </div>
            <p className="text-[11px] font-mono text-white/40">
              Sovereign Operating System &amp; Personal Coach
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startNewSession}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-mentra-amber" />
            <span className="hidden sm:inline">NEW SESSION</span>
          </button>

          <button
            onClick={() => setShowContextPanel(!showContextPanel)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all hidden md:flex"
            title="Toggle Telemetry Panel"
          >
            {showContextPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 overflow-hidden">
        
        {/* Left Drawer: Sessions (3 cols on desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col glass-panel bg-black/60 rounded-3xl border-white/10 p-4 space-y-3 overflow-y-auto">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-mentra-amber" />
            <span>INTELLIGENCE CHRONICLE</span>
          </div>

          <div className="space-y-1.5 flex-1">
            {conversations.length === 0 ? (
              <div className="p-3 text-xs font-mono text-white/40 text-center">
                No archived sessions yet.
              </div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-sans transition-all truncate block ${
                    activeConversationId === c.id
                      ? 'bg-mentra-orange/20 border border-mentra-orange/40 text-white font-semibold'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent text-white/70'
                  }`}
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center: Active Chat Stream (6 or 9 cols) */}
        <div className={`flex flex-col h-full glass-panel bg-black/70 rounded-3xl border-white/10 p-4 relative overflow-hidden ${
          showContextPanel ? 'lg:col-span-6' : 'lg:col-span-9'
        }`}>
          
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                {/* Message Bubble / System Panel */}
                <div className={`p-4 rounded-2xl max-w-[90%] sm:max-w-[82%] text-xs sm:text-sm font-sans leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-mentra-orange to-mentra-amber text-white font-medium rounded-tr-none'
                    : 'bg-white/5 border border-white/10 text-white/90 font-mono rounded-tl-none space-y-3'
                }`}>
                  <div className="flex items-center justify-between gap-4 text-[10px] text-white/40 pb-1 border-b border-white/5">
                    <span>{msg.role === 'user' ? 'OPERATOR' : 'MENTRA CORE'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {msg.content}
                  </p>

                  {/* Render Action Cards */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {msg.cards.map((card, cIdx) => (
                        <div 
                          key={cIdx} 
                          className="p-3 rounded-xl bg-black/80 border border-mentra-orange/30 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-mentra-orange/20 text-mentra-amber">
                              {card.type.includes('EXPENSE') ? <DollarSign className="w-4 h-4" /> : card.type.includes('QUEST') ? <Sword className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{card.title}</div>
                              {card.subtitle && <div className="text-[11px] text-white/60 font-mono">{card.subtitle}</div>}
                            </div>
                          </div>

                          {card.actionUrl && (
                            <Link 
                              href={card.actionUrl}
                              className="px-3 py-1 rounded-full bg-mentra-orange text-white text-[10px] font-mono font-bold flex items-center gap-1 hover:opacity-90 transition-all flex-shrink-0"
                            >
                              <span>{card.actionLabel || 'VIEW'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current Tool Execution Status Line */}
            {currentToolStatus && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-mentra-orange/10 border border-mentra-orange/30 text-mentra-amber text-xs font-mono animate-pulse max-w-sm">
                <Sparkles className="w-3.5 h-3.5 text-mentra-orange" />
                <span>[MENTRA STATUS]: {currentToolStatus}...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestion Quick Chips */}
          <div className="pt-2 pb-1 overflow-x-auto scrollbar-none flex gap-2">
            {sampleCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-mono whitespace-nowrap transition-colors flex-shrink-0"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Command Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            className="pt-2 flex items-center gap-2 relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask MENTRA anything... (/quest, /finance, /skills, /journal)"
              className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-2xl pl-4 pr-12 py-3.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-white shadow-[0_0_15px_rgba(91,108,255,0.4)] hover:opacity-90 disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right: Live Telemetry Context Panel (3 cols) */}
        {showContextPanel && (
          <div className="hidden lg:flex lg:col-span-3 flex-col glass-panel bg-black/60 rounded-3xl border-white/10 p-4 space-y-4 overflow-y-auto">
            <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-mentra-orange" />
              <span>LIVE TELEMETRY CONTEXT</span>
            </div>

            {/* Level Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">OPERATOR LEVEL</span>
                <span className="text-mentra-amber font-bold">LEVEL 0{displayLevel}</span>
              </div>
              <div className="text-[11px] font-mono text-white/70">
                XP: {displayXp} / {displayLevel * 1000}
              </div>
            </div>

            {/* Active Quests */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">ACTIVE QUESTS</span>
                <span className="text-white font-bold">{activeQuests.length}</span>
              </div>
              {activeQuests.slice(0, 2).map(q => (
                <div key={q.id} className="text-[11px] text-white/80 font-sans truncate">
                  • {q.title}
                </div>
              ))}
            </div>

            {/* Active Skill */}
            {activeSkill && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/50">SKILL TRACK</span>
                  <span className="text-mentra-amber font-bold">LVL {activeSkill.level}</span>
                </div>
                <div className="text-xs text-white/90 font-display truncate">
                  {activeSkill.name}
                </div>
              </div>
            )}

            {/* Capital Velocity */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">CAPITAL VELOCITY</span>
                <span className="text-emerald-400 font-bold">₹{finance.monthlyIncome}</span>
              </div>
              <div className="text-[11px] font-mono text-white/70">
                Expenses: ₹{finance.monthlyExpenses}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
