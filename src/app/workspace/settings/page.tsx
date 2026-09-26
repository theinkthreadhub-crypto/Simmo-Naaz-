'use client';

import React,{useEffect,useState} from 'react';
import { Building2,Users,CheckSquare,Activity,UserPlus,Plus,RefreshCw,AlertCircle } from 'lucide-react';
import { WorkspaceRole,WorkspaceType } from '@/lib/workspace/rbac';

export default function WorkspaceSettingsPage(){
  const [workspaces,setWorkspaces]=useState<any[]>([]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [members,setMembers]=useState<any[]>([]);
  const [tasks,setTasks]=useState<any[]>([]);
  const [activity,setActivity]=useState<any[]>([]);
  const [tab,setTab]=useState<'members'|'tasks'|'activity'>('members');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [workspaceName,setWorkspaceName]=useState('');
  const [workspaceType,setWorkspaceType]=useState<WorkspaceType>('BUSINESS');
  const [inviteEmail,setInviteEmail]=useState('');
  const [inviteRole,setInviteRole]=useState<WorkspaceRole>('EDITOR');
  const [taskTitle,setTaskTitle]=useState('');

  const loadWorkspaces=async()=>{
    setLoading(true);setError(null);
    try{
      const response=await fetch('/api/workspaces',{cache:'no-store'});const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Workspaces could not be loaded.');
      const list=data.workspaces||[];setWorkspaces(list);
      const next=activeId&&list.some((w:any)=>w.id===activeId)?activeId:list[0]?.id||null;
      setActiveId(next);
    }catch(err){setError(err instanceof Error?err.message:'Workspaces could not be loaded.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{loadWorkspaces();},[]);

  const loadDetails=async(id:string)=>{
    setError(null);
    try{
      const [m,t,a]=await Promise.all([
        fetch(`/api/workspaces/${id}/members`,{cache:'no-store'}),
        fetch(`/api/workspaces/${id}/tasks`,{cache:'no-store'}),
        fetch(`/api/workspaces/${id}/activity`,{cache:'no-store'})
      ]);
      const [md,td,ad]=await Promise.all([m.json(),t.json(),a.json()]);
      if(!m.ok)throw new Error(md.error||'Members could not be loaded.');
      if(!t.ok)throw new Error(td.error||'Tasks could not be loaded.');
      if(!a.ok)throw new Error(ad.error||'Activity could not be loaded.');
      setMembers(md.members||[]);setTasks(td.tasks||[]);setActivity(ad.activity||[]);
    }catch(err){setError(err instanceof Error?err.message:'Workspace details could not be loaded.');}
  };
  useEffect(()=>{if(activeId)loadDetails(activeId);else{setMembers([]);setTasks([]);setActivity([]);}},[activeId]);

  const createWorkspace=async(e:React.FormEvent)=>{
    e.preventDefault();if(!workspaceName.trim())return;
    const response=await fetch('/api/workspaces',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:workspaceName.trim(),type:workspaceType})});
    const data=await response.json();
    if(!response.ok){setError(data.error||'Workspace was not created.');return;}
    setWorkspaceName('');await loadWorkspaces();setActiveId(data.workspace.id);
  };

  const invite=async(e:React.FormEvent)=>{
    e.preventDefault();if(!activeId||!inviteEmail.trim())return;
    const response=await fetch(`/api/workspaces/${activeId}/invitations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inviteEmail.trim(),role:inviteRole})});
    const data=await response.json();
    if(!response.ok){setError(data.error||'Invitation was not created.');return;}
    setInviteEmail('');setError(null);await loadDetails(activeId);
  };

  const createTask=async(e:React.FormEvent)=>{
    e.preventDefault();if(!activeId||!taskTitle.trim())return;
    const response=await fetch(`/api/workspaces/${activeId}/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:taskTitle.trim(),priority:'NORMAL'})});
    const data=await response.json();
    if(!response.ok){setError(data.error||'Task was not created.');return;}
    setTaskTitle('');await loadDetails(activeId);
  };

  const updateTask=async(taskId:string,status:string)=>{
    if(!activeId)return;
    const response=await fetch(`/api/workspaces/${activeId}/tasks`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId,status})});
    const data=await response.json();
    if(!response.ok){setError(data.error||'Task was not updated.');return;}
    await loadDetails(activeId);
  };

  const active=workspaces.find(w=>w.id===activeId);

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-7">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest">REAL COLLABORATION DATA</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Workspaces</h1></div><button onClick={loadWorkspaces} disabled={loading} className="p-2.5 rounded-xl border border-white/10 bg-white/5"><RefreshCw className={`w-4 h-4 text-white/70 ${loading?'animate-spin':''}`}/></button></div>
    {error&&<div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
    {workspaces.length===0&&!loading?<form onSubmit={createWorkspace} className="p-6 rounded-3xl border border-white/10 bg-black/50 space-y-4"><div className="flex gap-2 text-white font-semibold"><Building2 className="w-5 h-5 text-mentra-amber"/>Create your first workspace</div><p className="text-sm text-white/45">No sample team members or tasks will be created automatically.</p><input required value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Workspace name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><select value={workspaceType} onChange={e=>setWorkspaceType(e.target.value as WorkspaceType)} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white"><option>BUSINESS</option><option>PERSONAL</option><option>TEAM</option></select><button className="px-5 py-3 rounded-xl bg-mentra-orange text-white text-sm font-semibold flex gap-2"><Plus className="w-4 h-4"/>Create workspace</button></form>:workspaces.length>0&&<>
      <div className="flex flex-wrap gap-2">{workspaces.map(w=><button key={w.id} onClick={()=>setActiveId(w.id)} className={`px-4 py-2 rounded-xl text-xs font-semibold ${w.id===activeId?'bg-mentra-orange text-white':'bg-white/5 text-white/55'}`}>{w.name}</button>)}</div>
      <div className="p-5 rounded-3xl border border-white/10 bg-black/45"><div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-mentra-amber"/><h2 className="font-bold text-white">{active?.name}</h2><span className="text-[10px] text-white/35">{active?.type} • {active?.status}</span></div></div>
      <div className="flex gap-2">{(['members','tasks','activity'] as const).map(x=><button key={x} onClick={()=>setTab(x)} className={`px-4 py-2 rounded-xl text-xs font-semibold ${tab===x?'bg-white text-black':'bg-white/5 text-white/55'}`}>{x.toUpperCase()}</button>)}</div>
      {tab==='members'&&<div className="space-y-4"><form onSubmit={invite} className="p-4 rounded-2xl border border-white/10 bg-black/45 flex flex-col sm:flex-row gap-2"><input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Invite email" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white"/><select value={inviteRole} onChange={e=>setInviteRole(e.target.value as WorkspaceRole)} className="bg-neutral-900 border border-white/10 rounded-xl px-3 text-white text-xs"><option>ADMIN</option><option>MANAGER</option><option>EDITOR</option><option>MEMBER</option><option>VIEWER</option></select><button className="px-4 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold flex gap-2 items-center justify-center"><UserPlus className="w-4 h-4"/>Invite</button></form><div className="grid md:grid-cols-2 gap-3">{members.length===0?<Empty text="No members returned."/>:members.map(m=><div key={m.id} className="p-4 rounded-2xl border border-white/10 bg-black/40"><div className="flex items-center justify-between"><div className="text-sm text-white font-semibold">{m.user_id}</div><span className="text-[10px] text-mentra-amber">{m.role}</span></div><div className="mt-1 text-[10px] text-white/35">{m.status}</div></div>)}</div></div>}
      {tab==='tasks'&&<div className="space-y-4"><form onSubmit={createTask} className="p-4 rounded-2xl border border-white/10 bg-black/45 flex gap-2"><input required value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="New task" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white"/><button className="px-4 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold">Create</button></form><div className="space-y-2">{tasks.length===0?<Empty text="No workspace tasks stored."/>:tasks.map(t=><div key={t.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="font-semibold text-white text-sm">{t.title}</div><div className="text-[10px] text-white/35 mt-1">{t.priority} • {t.status}</div></div><select value={t.status} onChange={e=>updateTask(t.id,e.target.value)} className="bg-neutral-900 border border-white/10 rounded-xl p-2 text-white text-xs"><option>TODO</option><option>IN_PROGRESS</option><option>BLOCKED</option><option>REVIEW</option><option>COMPLETE</option><option>CANCELLED</option></select></div>)}</div></div>}
      {tab==='activity'&&<div className="space-y-2">{activity.length===0?<Empty text="No activity recorded yet."/>:activity.map(a=><div key={a.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex gap-3"><Activity className="w-4 h-4 text-mentra-amber mt-0.5"/><div><div className="text-sm text-white">{a.action}</div><div className="text-[10px] text-white/35 mt-1">{a.resource_type} • {a.created_at?new Date(a.created_at).toLocaleString():''}</div></div></div>)}</div>}
    </>}
  </div>;
}
function Empty({text}:{text:string}){return <div className="p-6 rounded-2xl border border-white/10 bg-black/35 text-center text-sm text-white/40">{text}</div>}
