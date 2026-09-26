'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, RefreshCw, Plus, Package, Megaphone, Lightbulb, AlertCircle } from 'lucide-react';

export default function BusinessPage(){
  const [business,setBusiness]=useState<any>(null);
  const [brandProfile,setBrandProfile]=useState<any>(null);
  const [campaigns,setCampaigns]=useState<any[]>([]);
  const [products,setProducts]=useState<any[]>([]);
  const [opportunities,setOpportunities]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [creating,setCreating]=useState(false);

  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const response=await fetch('/api/business',{cache:'no-store'});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'Business workspace could not be loaded.');
      setBusiness(data.activeBusiness||null);
      setBrandProfile(data.brandProfile||null);
      if(!data.activeBusiness){setCampaigns([]);setProducts([]);setOpportunities([]);return;}
      const id=data.activeBusiness.id;
      const [c,p,o]=await Promise.all([
        fetch(`/api/business/campaigns?businessId=${encodeURIComponent(id)}`,{cache:'no-store'}),
        fetch(`/api/business/products?businessId=${encodeURIComponent(id)}`,{cache:'no-store'}),
        fetch(`/api/business/opportunities?businessId=${encodeURIComponent(id)}`,{cache:'no-store'})
      ]);
      const [cd,pd,od]=await Promise.all([c.json(),p.json(),o.json()]);
      if(!c.ok) throw new Error(cd.error||'Campaigns could not be loaded.');
      if(!p.ok) throw new Error(pd.error||'Products could not be loaded.');
      if(!o.ok) throw new Error(od.error||'Opportunities could not be loaded.');
      setCampaigns(cd.campaigns||[]);setProducts(pd.products||[]);setOpportunities(od.opportunities||[]);
    }catch(err){setError(err instanceof Error?err.message:'Business workspace could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const create=async(e:React.FormEvent)=>{
    e.preventDefault();if(!name.trim())return;setCreating(true);setError(null);
    try{
      const response=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),description:description.trim()})});
      const data=await response.json();
      if(!response.ok||!data.success) throw new Error(data.error||'Business was not created.');
      setName('');setDescription('');await load();
    }catch(err){setError(err instanceof Error?err.message:'Business was not created.');}
    finally{setCreating(false);}
  };

  const totalBudget=useMemo(()=>campaigns.reduce((s,c)=>s+Number(c.budget||0),0),[campaigns]);
  const avgMargin=useMemo(()=>products.length?products.reduce((s,p)=>s+Number(p.margin||0),0)/products.length:0,[products]);

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4"><div><div className="text-xs font-mono tracking-widest text-mentra-amber">REAL BUSINESS DATA</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">{business?.name||'Business Workspace'}</h1><p className="text-sm text-white/45 mt-1">{business?.description||'No business has been configured yet.'}</p></div><div className="flex gap-2"><button onClick={load} disabled={loading} className="p-2.5 rounded-xl border border-white/10 bg-white/5"><RefreshCw className={`w-4 h-4 text-white/70 ${loading?'animate-spin':''}`}/></button><Link href="/creator" className="px-4 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold">Creator Studio</Link></div></div>
    {error&&<div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
    {!loading&&!business?<form onSubmit={create} className="p-6 rounded-3xl border border-white/10 bg-black/50 space-y-4"><div className="flex gap-2 items-center text-white font-semibold"><Briefcase className="w-5 h-5 text-mentra-amber"/>Create your first business workspace</div><p className="text-sm text-white/45">MENTRA will not create a brand, budget or catalog unless you save it.</p><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Business name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"/><button disabled={creating} className="px-5 py-3 rounded-xl bg-mentra-orange text-white text-sm font-semibold flex gap-2"><Plus className="w-4 h-4"/>{creating?'Creating…':'Create business'}</button></form>:business&&<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Campaigns" value={campaigns.length}/><Kpi label="Products" value={products.length}/><Kpi label="Campaign budget" value={`₹${totalBudget.toLocaleString()}`}/><Kpi label="Average margin" value={products.length?`${avgMargin.toFixed(1)}%`:'—'}/></div>
      {brandProfile&&<div className="p-5 rounded-2xl border border-white/10 bg-black/40"><div className="text-[10px] text-white/35 uppercase">Brand profile</div><div className="mt-2 text-sm text-white/75">{brandProfile.tagline||brandProfile.positioning||'Profile exists with no tagline.'}</div></div>}
      <Section icon={<Megaphone className="w-4 h-4"/>} title="Campaigns" empty="No campaigns stored.">{campaigns.map(c=><Card key={c.id} title={c.name} meta={`${c.status} • Budget ₹${Number(c.budget||0).toLocaleString()}`} body={c.offer||c.objective}/>)}</Section>
      <Section icon={<Package className="w-4 h-4"/>} title="Products" empty="No products stored.">{products.map(p=><Card key={p.id} title={p.name} meta={`₹${Number(p.price||0).toLocaleString()} • ${Number(p.margin||0).toFixed(1)}% margin`} body={p.category||p.status}/>)}</Section>
      <Section icon={<Lightbulb className="w-4 h-4"/>} title="Research opportunities" empty="No verified research opportunities stored.">{opportunities.map(o=><Card key={o.id} title={o.title} meta={o.category} body={o.evidence}/>)}</Section>
    </>}
  </div>;
}
function Kpi({label,value}:{label:string;value:string|number}){return <div className="p-4 rounded-2xl border border-white/10 bg-black/45"><div className="text-[10px] uppercase text-white/35">{label}</div><div className="mt-2 text-xl font-mono font-bold text-white">{value}</div></div>}
function Section({icon,title,empty,children}:{icon:React.ReactNode;title:string;empty:string;children:React.ReactNode}){const count=React.Children.count(children);return <section className="p-5 rounded-3xl border border-white/10 bg-black/45 space-y-4"><h2 className="flex gap-2 items-center text-sm font-semibold text-white">{icon}{title}</h2>{count===0?<div className="text-sm text-white/40">{empty}</div>:<div className="grid md:grid-cols-2 gap-3">{children}</div>}</section>}
function Card({title,meta,body}:{title:string;meta:string;body?:string}){return <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.03]"><div className="font-semibold text-white">{title}</div><div className="mt-1 text-[11px] text-mentra-amber">{meta}</div>{body&&<p className="mt-2 text-xs text-white/50">{body}</p>}</div>}
