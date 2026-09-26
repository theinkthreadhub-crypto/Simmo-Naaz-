'use client';

import React,{useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import { Share2,CheckCircle2,AlertCircle,RefreshCw,Key,Mail,Calendar,HardDrive,FileSpreadsheet,Users,MessageSquare,Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Status='CONNECTED'|'DISCONNECTED'|'ACTION_REQUIRED'|'TOKEN_EXPIRED'|'CONFIG_REQUIRED'|'DEGRADED'|'DISABLED'|'CHECKING';
type Item={service:string;name:string;category:'GOOGLE'|'COMMUNICATION'|'RESEARCH';status:Status;accountEmail?:string;description:string};

const BASE:Item[]=[
  {service:'GOOGLE_ACCOUNT',name:'Google Workspace',category:'GOOGLE',status:'DISCONNECTED',description:'OAuth identity for Gmail, Calendar, Drive, Sheets and Contacts.'},
  {service:'GMAIL',name:'Gmail',category:'GOOGLE',status:'DISCONNECTED',description:'Read/search mail and prepare drafts after Google authorization.'},
  {service:'GOOGLE_CALENDAR',name:'Google Calendar',category:'GOOGLE',status:'DISCONNECTED',description:'Read real events and create approved calendar actions.'},
  {service:'GOOGLE_DRIVE',name:'Google Drive',category:'GOOGLE',status:'DISCONNECTED',description:'Access authorized files and documents.'},
  {service:'GOOGLE_SHEETS',name:'Google Sheets',category:'GOOGLE',status:'DISCONNECTED',description:'Read and update authorized spreadsheet data.'},
  {service:'GOOGLE_CONTACTS',name:'Google Contacts',category:'GOOGLE',status:'DISCONNECTED',description:'Look up authorized contact records.'},
  {service:'WHATSAPP_CLOUD_API',name:'WhatsApp Gateway',category:'COMMUNICATION',status:'DISCONNECTED',description:'Two-way WhatsApp channel after provider setup and linking.'},
  {service:'LIVE_WEB_RESEARCH',name:'Live Web Research',category:'RESEARCH',status:'DISCONNECTED',description:'Live search provider used by research agents.'}
];

export default function ConnectionsPage(){
  const searchParams=useSearchParams();
  const [items,setItems]=useState<Item[]>(BASE);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const [statusRes,healthRes]=await Promise.all([
        fetch('/api/integrations/status',{cache:'no-store'}),
        fetch('/api/system/health',{cache:'no-store'})
      ]);
      const statusData=await statusRes.json();
      const healthData=await healthRes.json();
      if(!statusRes.ok)throw new Error(statusData.error||'Integration status unavailable.');

      const rows=statusData.integrations||[];
      const googleRows=rows.filter((r:any)=>String(r.service||r.provider||'').startsWith('GOOGLE')||r.provider==='GOOGLE');
      const googleConnected=googleRows.some((r:any)=>r.status==='CONNECTED');
      const googleEmail=googleRows.find((r:any)=>r.account_email)?.account_email;
      const whatsappStatus=healthData?.capabilities?.whatsapp_cloud?.status||'CONFIG_REQUIRED';
      const researchStatus=healthData?.capabilities?.live_research?.status||'CONFIG_REQUIRED';

      setItems(BASE.map(item=>{
        const direct=rows.find((r:any)=>r.service===item.service);
        if(direct)return{...item,status:direct.status||'DISCONNECTED',accountEmail:direct.account_email};
        if(item.category==='GOOGLE')return{...item,status:googleConnected?'CONNECTED':'DISCONNECTED',accountEmail:googleEmail};
        if(item.service==='WHATSAPP_CLOUD_API')return{...item,status:whatsappStatus};
        if(item.service==='LIVE_WEB_RESEARCH')return{...item,status:researchStatus};
        return item;
      }));
    }catch(err){setError(err instanceof Error?err.message:'Integration status unavailable.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const googleConnected=useMemo(()=>items.some(i=>i.category==='GOOGLE'&&i.status==='CONNECTED'),[items]);
  const connected=items.filter(i=>i.status==='CONNECTED').length;

  const disconnect=async()=>{
    if(!confirm('Disconnect Google Workspace?'))return;
    const response=await fetch('/api/integrations/google/disconnect',{method:'POST'});
    const data=await response.json();
    if(!response.ok||!data.success){setError(data.error||'Disconnect failed.');return;}
    await load();
  };

  const icon=(service:string)=>service==='GMAIL'?<Mail className="w-5 h-5"/>:service==='GOOGLE_CALENDAR'?<Calendar className="w-5 h-5"/>:service==='GOOGLE_DRIVE'?<HardDrive className="w-5 h-5"/>:service==='GOOGLE_SHEETS'?<FileSpreadsheet className="w-5 h-5"/>:service==='GOOGLE_CONTACTS'?<Users className="w-5 h-5"/>:service==='WHATSAPP_CLOUD_API'?<MessageSquare className="w-5 h-5"/>:service==='LIVE_WEB_RESEARCH'?<Sparkles className="w-5 h-5"/>:<Key className="w-5 h-5"/>;

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-7">
    <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest flex gap-2"><Share2 className="w-4 h-4"/>REAL INTEGRATION STATUS</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Connections</h1></div><div className="flex gap-2 items-center"><span className="text-xs text-white/45">{connected}/{items.length} connected</span><button onClick={load} disabled={loading} className="p-2 rounded-xl bg-white/5 border border-white/10"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button></div></div>
    {searchParams.get('status')==='success'&&<div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 flex gap-2"><CheckCircle2 className="w-4 h-4"/>Connection completed.</div>}
    {searchParams.get('status')==='error'&&<div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 flex gap-2"><AlertCircle className="w-4 h-4"/>{searchParams.get('message')||'Connection failed.'}</div>}
    {error&&<div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200">{error}</div>}
    <div className="p-5 rounded-3xl border border-white/10 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h2 className="font-bold text-white">Google Workspace</h2><p className="mt-1 text-sm text-white/50">{googleConnected?'Authorized Google connection detected.':'Not connected. MENTRA cannot read Gmail, Calendar or Drive until you authorize it.'}</p></div>{googleConnected?<button onClick={disconnect} className="px-5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold">DISCONNECT</button>:<button onClick={()=>{window.location.href='/api/integrations/google/connect'}} className="px-5 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold">CONNECT GOOGLE</button>}</div>
    <div className="grid md:grid-cols-2 gap-3">{items.map(item=><div key={item.service} className="p-5 rounded-2xl border border-white/10 bg-black/45"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="p-2.5 rounded-xl bg-white/5 text-mentra-amber">{icon(item.service)}</div><div><h3 className="font-semibold text-white">{item.name}</h3><div className={`mt-1 text-[10px] font-mono ${item.status==='CONNECTED'?'text-emerald-400':item.status==='CONFIG_REQUIRED'?'text-amber-300':'text-white/40'}`}>{item.status}</div></div></div>{item.service==='WHATSAPP_CLOUD_API'&&<Link href="/connections/whatsapp" className="text-xs text-cyan-300">Open</Link>}</div><p className="mt-3 text-xs text-white/50">{item.description}</p>{item.accountEmail&&<div className="mt-2 text-[11px] text-white/35">{item.accountEmail}</div>}</div>)}</div>
  </div>;
}
