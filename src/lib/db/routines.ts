import { createClient } from '@/lib/supabase/server';

export interface RoutineStep {stepIndex:number;title:string;durationMin:number;actionType:string;refId?:string;}
export interface Routine {
  id:string;userId:string;name:string;routineType:'MORNING'|'NIGHT'|'DEEP_WORK'|'WEEKEND'|'CUSTOM';
  durationMinutes:number;steps:RoutineStep[];triggerTime?:string;days:string[];active:boolean;createdAt:string;
}
function mapRoutine(r:any):Routine{return{
  id:r.id,userId:r.user_id,name:r.name,routineType:r.routine_type,durationMinutes:r.duration_minutes,
  steps:r.steps||[],triggerTime:r.trigger_time||undefined,days:r.days||[],active:r.active,createdAt:r.created_at
};}

export async function createRoutine(userId:string,routine:{name:string;routineType?:Routine['routineType'];durationMinutes?:number;steps?:RoutineStep[];triggerTime?:string;days?:string[]}):Promise<Routine>{
  const supabase=createClient();
  const {data,error}=await supabase.from('routines').insert({
    user_id:userId,name:routine.name,routine_type:routine.routineType||'CUSTOM',
    duration_minutes:Number(routine.durationMinutes||0),steps:routine.steps||[],trigger_time:routine.triggerTime||null,
    days:routine.days||[],active:true
  }).select().single();
  if(error||!data)throw new Error(error?.message||'Failed to create routine.');
  return mapRoutine(data);
}

export async function listUserRoutines(userId:string):Promise<Routine[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('routines').select('*').eq('user_id',userId).eq('active',true).order('created_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]).map(mapRoutine);
}
export const getRoutines=listUserRoutines;
