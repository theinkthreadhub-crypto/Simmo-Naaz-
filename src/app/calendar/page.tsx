'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

interface CalendarEvent {
  id:string; summary:string; description?:string; start:string; end:string; location?:string; meetLink?:string; attendeesCount?:number;
}

export default function CalendarPage(){
  const [events,setEvents]=useState<CalendarEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [connectionRequired,setConnectionRequired]=useState(false);

  const load=async()=>{
    setLoading(true);setError(null);setConnectionRequired(false);
    try{
      const response=await fetch('/api/calendar/events',{cache:'no-store'});
      const data=await response.json();
      if(!response.ok){
        if(response.status===409){setConnectionRequired(true);setEvents([]);return;}
        throw new Error(data.error||'Calendar could not be loaded.');
      }
      setEvents(data.events||[]);
    }catch(err){setError(err instanceof Error?err.message:'Calendar could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-7">
    <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest">GOOGLE CALENDAR — LIVE DATA</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Calendar</h1></div><button onClick={load} disabled={loading} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button></div>
    {connectionRequired?<div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 text-center"><AlertCircle className="w-9 h-9 mx-auto text-amber-300"/><h2 className="mt-3 font-semibold text-white">Google Calendar is not connected</h2><p className="mt-1 text-sm text-white/55">Connect Google Workspace before MENTRA can read your real calendar.</p><Link href="/connections" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold">OPEN CONNECTIONS <ExternalLink className="w-3.5 h-3.5"/></Link></div>:error?<div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200">{error}</div>:loading?<div className="p-10 text-center text-white/40">Loading real calendar events…</div>:events.length===0?<div className="p-12 text-center rounded-3xl border border-white/10 bg-black/40"><Calendar className="w-10 h-10 mx-auto text-white/20"/><p className="mt-3 text-sm text-white/45">No calendar events found in the current day window.</p></div>:<div className="space-y-3">{events.map(event=><div key={event.id} className="p-5 rounded-2xl border border-white/10 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex gap-3"><Clock className="w-4 h-4 mt-1 text-mentra-amber"/><div><div className="text-sm font-semibold text-white">{event.summary}</div><div className="mt-1 text-xs text-white/45">{new Date(event.start).toLocaleString()} → {new Date(event.end).toLocaleTimeString()}</div>{event.location&&<div className="mt-1 text-xs text-white/35">{event.location}</div>}</div></div>{event.meetLink&&<a href={event.meetLink} target="_blank" rel="noreferrer" className="text-xs text-cyan-300">Join meeting</a>}</div>)}</div>}
  </div>;
}
