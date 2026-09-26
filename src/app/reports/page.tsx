'use client';

import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function ReportsPage(){
  const {profile,progress,user}=useAuth();
  const {player,finance,quests,skills,journalEntries,memories}=useMentraStore();
  const level=progress?.level??player.level;
  const name=profile?.display_name||user?.user_metadata?.display_name||'Operator';
  const completed=quests.filter(q=>q.status==='COMPLETED').length;
  const active=quests.filter(q=>q.status==='ACTIVE').length;
  const hasData=quests.length+skills.length+finance.transactions.length+journalEntries.length+memories.length>0;

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-7">
    <div className="border-b border-white/10 pb-4"><div className="text-xs font-mono text-mentra-amber tracking-widest">VERIFIED DATA REPORT</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Current Intelligence Snapshot</h1></div>
    <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-black/55 space-y-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-white">{name}</h2><div className="text-xs text-white/40">Level {level} • Current persisted state</div></div><FileText className="w-6 h-6 text-mentra-amber"/></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Active quests" value={String(active)}/><Metric label="Completed quests" value={String(completed)}/><Metric label="Net cash flow" value={`₹${finance.monthlySavings.toLocaleString()}`}/><Metric label="Tracked skills" value={String(skills.length)}/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Finance records" value={String(finance.transactions.length)}/><Metric label="Journal entries" value={String(journalEntries.length)}/><Metric label="Memories" value={String(memories.length)}/><Metric label="Streak" value={`${progress?.current_streak??player.streakDays} days`}/></div>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-white/65">{hasData?<div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5"/>All figures above come from the connected MENTRA data store. No fabricated AI narrative is shown.</div>:'No verified activity exists yet. Use MENTRA and its modules to create real data before a report is generated.'}</div>
    </div>
  </div>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="p-4 rounded-2xl bg-white/5 border border-white/5"><div className="text-[10px] uppercase text-white/35">{label}</div><div className="mt-1 text-xl font-mono font-bold text-white">{value}</div></div>}
