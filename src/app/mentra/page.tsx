'use client';

import React,{useEffect,useRef,useState} from 'react';
import { Bot,Send,Plus,Activity,Clock,ChevronRight,PanelRightClose,PanelRightOpen,AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';
import { ActionCard,MentraConversation } from '@/lib/ai/types';

interface ChatMessage{id:string;role:'user'|'assistant';content:string;cards?:ActionCard[];timestamp:string}
type AiStatus='CONNECTED'|'CONFIG_REQUIRED'|'DEGRADED'|'DISABLED'|'CHECKING';

export default function MentraChatPage(){
  const {user,profile,progress}=useAuth();
  const {player,quests,skills,finance,syncUserDatabase}=useMentraStore();
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [conversations,setConversations]=useState<MentraConversation[]>([]);
  const [showContext,setShowContext]=useState(true);
  const [aiStatus,setAiStatus]=useState<AiStatus>('CHECKING');
  const [statusText,setStatusText]=useState('Checking real AI provider…');
  const endRef=useRef<HTMLDivElement|null>(null);

  const level=progress?.level??player.level;
  const xp=progress?.current_xp??player.currentXp;
  const activeQuests=quests.filter(q=>q.status==='ACTIVE');
  const name=profile?.display_name||user?.user_metadata?.display_name||'Operator';

  const loadHealth=async()=>{
    try{
      const response=await fetch('/api/system/health',{cache:'no-store'});
      const data=await response.json();
      const capability=data?.capabilities?.ai_core;
      setAiStatus((capability?.status||'DEGRADED') as AiStatus);
      setStatusText(capability?.description||'AI provider status unavailable.');
    }catch{setAiStatus('DEGRADED');setStatusText('AI provider status unavailable.');}
  };

  const loadConversations=async()=>{
    try{
      const response=await fetch('/api/mentra/conversations',{cache:'no-store'});
      const data=await response.json();
      if(response.ok)setConversations(data.conversations||[]);
    }catch{}
  };

  useEffect(()=>{loadHealth();loadConversations();setMessages([{id:'welcome',role:'assistant',content:`MENTRA session ready for ${name}. I will only report actions and data that are actually available or verified.`,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);},[name]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,loading]);

  const openConversation=async(id:string)=>{
    try{
      const response=await fetch(`/api/mentra/conversations?conversationId=${encodeURIComponent(id)}`,{cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Conversation could not be loaded.');
      setActiveId(id);
      setMessages((data.messages||[]).map((m:any)=>({
        id:m.id,
        role:m.role==='ASSISTANT'?'assistant':'user',
        content:m.content,
        cards:m.cards||[],
        timestamp:new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
      })));
    }catch(err){
      setMessages(prev=>[...prev,{id:`err_${Date.now()}`,role:'assistant',content:err instanceof Error?err.message:'Conversation could not be loaded.',timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    }
  };

  const send=async(custom?:string)=>{
    const text=(custom??input).trim();if(!text||loading)return;
    setMessages(prev=>[...prev,{id:`u_${Date.now()}`,role:'user',content:text,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    setInput('');setLoading(true);
    try{
      const response=await fetch('/api/mentra/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,conversationId:activeId||undefined,pageContext:'mentra_chat'})});
      const data=await response.json();
      if(!response.ok||data.success===false)throw new Error(data.message||data.error||'MENTRA request failed.');
      if(data.conversationId&&!activeId)setActiveId(data.conversationId);
      setMessages(prev=>[...prev,{id:`a_${Date.now()}`,role:'assistant',content:data.message||'No response returned.',cards:data.cards||[],timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
      if(user?.id&&Array.isArray(data.toolCallsExecuted)&&data.toolCallsExecuted.length>0)await syncUserDatabase(user.id);
      await loadConversations();
      await loadHealth();
    }catch(err){
      setMessages(prev=>[...prev,{id:`err_${Date.now()}`,role:'assistant',content:`Request failed: ${err instanceof Error?err.message:'Unknown error'}`,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    }finally{setLoading(false);}
  };

  const newSession=()=>{setActiveId(null);setMessages([{id:`new_${Date.now()}`,role:'assistant',content:'New verified intelligence session started. What should I do?',timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);};

  const connected=aiStatus==='CONNECTED';
  const samples=['Aaj mujhe kya karna chahiye?','Kal product upload karne ka quest banao','Mera finance summary batao','Maine ads ke bare me kya save kiya hai?'];

  return <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-[88vh] flex flex-col">
    <div className="flex items-center justify-between py-3 border-b border-white/10 gap-3">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-mentra-orange flex items-center justify-center"><Bot className="w-5 h-5 text-white"/></div><div><div className="flex items-center gap-2"><h1 className="text-base sm:text-lg font-bold text-white">MENTRA AI CORE</h1><span className={`text-[10px] px-2 py-0.5 rounded-full border ${connected?'bg-emerald-500/10 text-emerald-300 border-emerald-500/30':'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>{aiStatus}</span></div><p className="text-[10px] text-white/40 max-w-[65vw] truncate">{statusText}</p></div></div>
      <div className="flex gap-2"><button onClick={newSession} className="p-2 sm:px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 flex gap-1"><Plus className="w-4 h-4"/><span className="hidden sm:inline text-xs">New</span></button><button onClick={()=>setShowContext(v=>!v)} className="hidden lg:block p-2 rounded-xl bg-white/5 border border-white/10">{showContext?<PanelRightClose className="w-4 h-4 text-white/60"/>:<PanelRightOpen className="w-4 h-4 text-white/60"/>}</button></div>
    </div>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 overflow-hidden">
      <aside className="hidden lg:flex lg:col-span-3 flex-col rounded-3xl border border-white/10 bg-black/50 p-4 overflow-y-auto"><div className="text-[10px] text-white/35 flex gap-2"><Clock className="w-3 h-3"/>SESSIONS</div><div className="mt-3 space-y-1">{conversations.length===0?<div className="text-xs text-white/30 p-3">No saved sessions yet.</div>:conversations.map(c=><button key={c.id} onClick={()=>openConversation(c.id)} className={`w-full text-left p-2.5 rounded-xl text-xs truncate ${activeId===c.id?'bg-mentra-orange/20 text-white':'bg-white/5 text-white/55'}`}>{c.title}</button>)}</div></aside>

      <main className={`lg:col-span-${showContext?'6':'9'} flex flex-col rounded-3xl border border-white/10 bg-black/60 p-3 sm:p-4 overflow-hidden`}>
        {!connected&&<div className="mb-3 p-3 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 text-xs flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0"/>Real model status is {aiStatus}. MENTRA will not simulate an AI answer if a live provider is unavailable.</div>}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">{messages.map(msg=><div key={msg.id} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[90%] sm:max-w-[82%] p-4 rounded-2xl text-sm ${msg.role==='user'?'bg-mentra-orange text-white':'bg-white/5 border border-white/10 text-white/85'}`}><div className="text-[9px] opacity-40 mb-2 flex justify-between gap-4"><span>{msg.role==='user'?'OPERATOR':'MENTRA'}</span><span>{msg.timestamp}</span></div><p className="whitespace-pre-wrap">{msg.content}</p>{msg.cards&&msg.cards.length>0&&<div className="mt-3 pt-3 border-t border-white/10 space-y-2">{msg.cards.map(card=><div key={card.id} className="p-3 rounded-xl bg-black/50 border border-white/10"><div className="font-semibold text-xs">{card.title}</div>{card.subtitle&&<div className="text-[11px] text-white/50 mt-1">{card.subtitle}</div>}{card.actionUrl&&<Link href={card.actionUrl} className="mt-2 inline-flex items-center text-[10px] text-cyan-300">{card.actionLabel||'Open'}<ChevronRight className="w-3 h-3"/></Link>}</div>)}</div>}</div></div>)}{loading&&<div className="text-xs text-mentra-amber flex gap-2 items-center"><Activity className="w-3 h-3 animate-pulse"/>Running real model/tool loop…</div>}<div ref={endRef}/></div>
        <div className="pt-2 overflow-x-auto flex gap-2">{samples.map(s=><button key={s} onClick={()=>send(s)} disabled={loading} className="px-3 py-1.5 rounded-full bg-white/5 text-[10px] text-white/55 whitespace-nowrap">{s}</button>)}</div>
        <form onSubmit={e=>{e.preventDefault();send();}} className="pt-2 relative"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask MENTRA…" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-white text-sm"/><button disabled={loading||!input.trim()} className="absolute right-2 top-4 p-2 rounded-xl bg-mentra-orange text-white disabled:opacity-30"><Send className="w-4 h-4"/></button></form>
      </main>

      {showContext&&<aside className="hidden lg:flex lg:col-span-3 flex-col rounded-3xl border border-white/10 bg-black/50 p-4 space-y-3 overflow-y-auto"><div className="text-[10px] text-white/35">VERIFIED CONTEXT</div><Context label="Level" value={String(level)}/><Context label="XP" value={String(xp)}/><Context label="Active quests" value={String(activeQuests.length)}/><Context label="Skills" value={String(skills.length)}/><Context label="Income" value={`₹${finance.monthlyIncome.toLocaleString()}`}/><Context label="Expenses" value={`₹${finance.monthlyExpenses.toLocaleString()}`}/></aside>}
    </div>
  </div>;
}
function Context({label,value}:{label:string;value:string}){return <div className="p-3 rounded-xl bg-white/5 border border-white/5"><div className="text-[9px] uppercase text-white/35">{label}</div><div className="mt-1 text-sm font-mono text-white">{value}</div></div>}
