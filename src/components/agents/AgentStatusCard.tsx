'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ShieldAlert, Compass, Mail, Calendar, HardDrive, DollarSign, GraduationCap, Briefcase, Cpu } from 'lucide-react';
import { MentraAgent } from '@/types/mentra';

export default function AgentStatusCard({agent}:{agent:MentraAgent}){
  const icon=agent.iconName==='Compass'?<Compass className="w-4 h-4"/>:agent.iconName==='Mail'?<Mail className="w-4 h-4"/>:agent.iconName==='Calendar'?<Calendar className="w-4 h-4"/>:agent.iconName==='HardDrive'?<HardDrive className="w-4 h-4"/>:agent.iconName==='DollarSign'?<DollarSign className="w-4 h-4"/>:agent.iconName==='GraduationCap'?<GraduationCap className="w-4 h-4"/>:agent.iconName==='Briefcase'?<Briefcase className="w-4 h-4"/>:<Cpu className="w-4 h-4"/>;
  const waiting=agent.status==='WAITING_APPROVAL'||agent.status==='AWAITING_APPROVAL';
  const statusIcon=agent.status==='WORKING'?<Loader2 className="w-3 h-3 animate-spin"/>:waiting?<AlertCircle className="w-3 h-3"/>:<CheckCircle2 className="w-3 h-3"/>;
  return <div className="p-5 rounded-2xl border border-white/10 bg-black/55">
    <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="p-2.5 rounded-xl bg-white/5 text-mentra-amber">{icon}</div><div><div className="text-[10px] text-white/35">{agent.permissionLevel} PRIVILEGE</div><h3 className="font-bold text-white mt-1">{agent.name}</h3></div></div><span className="flex items-center gap-1.5 text-[10px] text-white/55">{statusIcon}{agent.status}</span></div>
    <p className="mt-3 text-xs text-white/60">{agent.description}</p>
    {agent.currentTask&&<div className="mt-3 p-3 rounded-xl bg-white/5 text-xs text-white/70">Task: {agent.currentTask}</div>}
    {waiting&&<div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3"><div className="text-xs text-amber-300 flex gap-2"><ShieldAlert className="w-4 h-4"/>Verified approval required</div><Link href="/approvals" className="px-4 py-2 rounded-full bg-mentra-orange text-white text-xs font-semibold">OPEN APPROVAL CENTER</Link></div>}
  </div>;
}
