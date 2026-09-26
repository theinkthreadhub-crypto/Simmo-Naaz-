'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Plus, X, AlertCircle } from 'lucide-react';
import SkillNode from '@/components/skills/SkillNode';
import { useMentraStore } from '@/lib/store/mentraStore';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SkillsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { skills, syncUserDatabase } = useMentraStore();
  const [open,setOpen]=useState(false);
  const [skillName,setSkillName]=useState('');
  const [whyLearn,setWhyLearn]=useState('');
  const [currentExperience,setCurrentExperience]=useState('Beginner');
  const [targetGoal,setTargetGoal]=useState('');
  const [timeAvailableMins,setTimeAvailableMins]=useState(15);
  const [preferredLanguage,setPreferredLanguage]=useState('Both (Hindi + English)');
  const [mainDifficulty,setMainDifficulty]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!user?.id||!skillName.trim()) return;
    setSaving(true);setError(null);
    try{
      const response=await fetch('/api/skills/onboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        skillName:skillName.trim(),whyLearn:whyLearn.trim(),currentExperience,targetGoal:targetGoal.trim(),timeAvailableMins,preferredLanguage,learningPreference:'Practical Execution',mainDifficulty
      })});
      const data=await response.json();
      if(!response.ok||!data.success) throw new Error(data.error||'Skill was not initialized.');
      await syncUserDatabase(user.id);
      setOpen(false);
      router.push(`/skills/${data.skillId}/coach`);
    }catch(err){setError(err instanceof Error?err.message:'Skill was not initialized.');}
    finally{setSaving(false);}
  };

  const totalXp=skills.reduce((sum,s)=>sum+s.currentXp,0);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4"><div><div className="text-xs font-mono text-mentra-amber tracking-widest">PERSISTED LEARNING TRACKS</div><h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Skills</h1></div><div className="flex items-center gap-3"><span className="text-xs text-white/45">Verified XP: {totalXp}</span><button onClick={()=>setOpen(true)} className="px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold flex gap-2"><Plus className="w-4 h-4"/>LEARN NEW SKILL</button></div></div>
    {error&&<div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
    {skills.length===0?<div className="p-12 text-center rounded-3xl border border-white/10 bg-black/40"><Brain className="w-10 h-10 mx-auto text-white/20"/><p className="mt-3 text-sm text-white/45">No skill progress exists yet. Start a skill to create a real learning track.</p></div>:<div className="grid grid-cols-1 md:grid-cols-2 gap-5">{skills.map(skill=><SkillNode key={skill.id} skill={skill}/>)}</div>}
    {open&&<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-neutral-950 border border-white/15 p-6 space-y-4"><div className="flex justify-between"><h2 className="font-bold text-white">Start a real learning track</h2><button type="button" onClick={()=>setOpen(false)}><X className="w-5 h-5 text-white/50"/></button></div><input required value={skillName} onChange={e=>setSkillName(e.target.value)} placeholder="Skill name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><textarea required value={whyLearn} onChange={e=>setWhyLearn(e.target.value)} rows={2} placeholder="Why do you want to learn it?" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"/><input value={targetGoal} onChange={e=>setTargetGoal(e.target.value)} placeholder="Target outcome" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><div className="grid grid-cols-2 gap-2"><select value={currentExperience} onChange={e=>setCurrentExperience(e.target.value)} className="bg-neutral-900 border border-white/10 rounded-xl p-3 text-white text-xs"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><select value={timeAvailableMins} onChange={e=>setTimeAvailableMins(Number(e.target.value))} className="bg-neutral-900 border border-white/10 rounded-xl p-3 text-white text-xs"><option value={15}>15 min/day</option><option value={30}>30 min/day</option><option value={60}>60 min/day</option></select></div><select value={preferredLanguage} onChange={e=>setPreferredLanguage(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white text-xs"><option>Both (Hindi + English)</option><option>English</option><option>Hindi</option></select><input value={mainDifficulty} onChange={e=>setMainDifficulty(e.target.value)} placeholder="Current difficulty (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"/><button disabled={saving} className="w-full py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-50">{saving?'Initializing…':'Initialize skill'}</button></form></div>}
  </div>;
}
