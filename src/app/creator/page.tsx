'use client';

import React,{useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import { Sparkles, RefreshCw, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';

export default function CreatorPage(){
  const [business,setBusiness]=useState<any>(null);
  const [content,setContent]=useState<any[]>([]);
  const [assets,setAssets]=useState<any[]>([]);
  const [tab,setTab]=useState<'pipeline'|'scripts'|'assets'>('pipeline');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const biz=await fetch('/api/business',{cache:'no-store'});const bd=await biz.json();
      if(!biz.ok)throw new Error(bd.error||'Business workspace could not be loaded.');
      const active=bd.activeBusiness||null;setBusiness(active);
      if(!active){setContent([]);setAssets([]);return;}
      const [cr,ar]=await Promise.all([
        fetch(`/api/creator/content?businessId=${encodeURIComponent(active.id)}`,{cache:'no-store'}),
        fetch(`/api/creator/assets?businessId=${encodeURIComponent(active.id)}`,{cache:'no-store'})
      ]);
      const [cd,ad]=await Promise.all([cr.json(),ar.json()]);
      if(!cr.ok)throw new Error(cd.error||'Creator content could not be loaded.');
      if(!ar.ok)throw new Error(ad.error||'Creative assets could not be loaded.');
      setContent(cd.content||[]);setAssets(ad.assets||[]);
    }catch(err){setError(err instanceof Error?err.message:'Creator data could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const buckets=useMemo(()=>({
    ideas:content.filter(c=>['IDEA','RESEARCHED','PLANNED','DRAFT'].includes(c.status)),
    review:content.filter(c=>['CREATIVE_READY','REVIEW','APPROVED'].includes(c.status)),
    published:content.filter(c=>['SCHEDULED','PUBLISHED'].includes(c.status))
  }),[content]);

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-7">
    <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest">PERSISTED CREATOR PIPELINE</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Creator Studio</h1><p className="text-sm text-white/40 mt-1">{business?business.name:'No business selected'}</p></div><button onClick={load} disabled={loading} className="p-2.5 rounded-xl bg-white/5 border border-white/10"><RefreshCw className={`w-4 h-4 text-white/70 ${loading?'animate-spin':''}`}/></button></div>
    {error&&<div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
    {!loading&&!business?<div className="p-10 rounded-3xl border border-amber-500/30 bg-amber-500/10 text-center"><Sparkles className="w-9 h-9 mx-auto text-amber-300"/><h2 className="mt-3 font-semibold text-white">Business workspace required</h2><p className="mt-1 text-sm text-white/50">Create a real business before storing creator content.</p><Link href="/business" className="mt-4 inline-block px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold">OPEN BUSINESS</Link></div>:business&&<>
      <div className="flex gap-2 overflow-x-auto">{(['pipeline','scripts','assets'] as const).map(x=><button key={x} onClick={()=>setTab(x)} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${tab===x?'bg-mentra-orange text-white':'bg-white/5 text-white/55'}`}>{x.toUpperCase()}</button>)}</div>
      {tab==='pipeline'&&<div className="grid md:grid-cols-3 gap-4"><Pipeline title="Ideas & drafts" items={buckets.ideas}/><Pipeline title="Review & approved" items={buckets.review}/><Pipeline title="Scheduled & published" items={buckets.published}/></div>}
      {tab==='scripts'&&<div className="space-y-3">{content.filter(c=>c.script||c.caption||c.creativeBrief).length===0?<Empty text="No stored scripts or creative briefs yet."/>:content.filter(c=>c.script||c.caption||c.creativeBrief).map(c=><div key={c.id} className="p-5 rounded-2xl border border-white/10 bg-black/45"><div className="flex gap-2 items-center"><FileText className="w-4 h-4 text-mentra-amber"/><h3 className="font-semibold text-white">{c.title}</h3></div>{c.script&&<pre className="mt-3 whitespace-pre-wrap text-xs text-white/65 font-sans">{c.script}</pre>}{c.caption&&<p className="mt-3 text-xs text-white/55">{c.caption}</p>}{c.creativeBrief&&<pre className="mt-3 whitespace-pre-wrap text-xs text-white/45">{JSON.stringify(c.creativeBrief,null,2)}</pre>}</div>)}</div>}
      {tab==='assets'&&(assets.length===0?<Empty text="No creative assets stored yet."/>:<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{assets.map(a=><div key={a.id} className="p-4 rounded-2xl border border-white/10 bg-black/45"><div className="h-28 rounded-xl bg-white/[0.03] flex items-center justify-center"><ImageIcon className="w-7 h-7 text-white/20"/></div><div className="mt-3 font-semibold text-white text-sm">{a.title}</div><div className="mt-1 text-[11px] text-white/40">{a.assetType} • {a.status}{a.dimensions?` • ${a.dimensions}`:''}</div>{(a.storageUrl||a.externalUrl)&&<a href={a.storageUrl||a.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyan-300">Open asset</a>}</div>)}</div>)}
    </>}
  </div>;
}
function Pipeline({title,items}:{title:string;items:any[]}){return <div className="p-4 rounded-3xl border border-white/10 bg-black/45"><div className="text-xs font-bold text-white/55 uppercase">{title} ({items.length})</div><div className="mt-4 space-y-2">{items.length===0?<div className="text-xs text-white/35">No real items.</div>:items.map(item=><div key={item.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5"><div className="text-sm font-semibold text-white">{item.title}</div><div className="text-[10px] text-mentra-amber mt-1">{item.platform} • {item.contentType} • {item.status}</div></div>)}</div></div>}
function Empty({text}:{text:string}){return <div className="p-10 rounded-3xl border border-white/10 bg-black/40 text-center text-sm text-white/45">{text}</div>}
