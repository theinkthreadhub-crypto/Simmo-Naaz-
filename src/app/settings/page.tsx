'use client';

import React from 'react';
import { Settings, User, Database, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SettingsPage(){
  const {user,profile,signOut}=useAuth();
  const name=profile?.display_name||user?.user_metadata?.display_name||'Operator';
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
    <div className="border-b border-white/10 pb-4"><div className="flex items-center gap-2 text-xs font-mono text-mentra-amber tracking-widest"><Settings className="w-4 h-4"/>OPERATOR CONFIGURATION</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">System & Privacy Settings</h1></div>
    <div className="p-6 rounded-3xl border border-white/10 bg-black/55 space-y-4"><h2 className="font-bold text-white flex gap-2"><User className="w-4 h-4"/>Identity</h2><div className="grid sm:grid-cols-2 gap-3"><Info label="DISPLAY NAME" value={name}/><Info label="AUTHENTICATED EMAIL" value={user?.email||'Not available'}/></div></div>
    <div className="p-6 rounded-3xl border border-white/10 bg-black/55"><h2 className="font-bold text-white flex gap-2"><Database className="w-4 h-4 text-emerald-400"/>Data truth policy</h2><p className="mt-2 text-sm text-white/55">Production MENTRA does not seed sample personal data. Quests, finance, goals, memory, journals and agent outcomes are shown only when persisted or returned by a verified integration.</p></div>
    <div className="flex justify-end"><button onClick={async()=>await signOut()} className="px-6 py-3 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold flex gap-2"><LogOut className="w-4 h-4"/>SIGN OUT</button></div>
  </div>;
}
function Info({label,value}:{label:string;value:string}){return <div className="p-4 rounded-2xl bg-white/5"><div className="text-[10px] text-white/35">{label}</div><div className="mt-1 text-sm font-semibold text-white truncate">{value}</div></div>}
