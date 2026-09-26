import { createClient } from '@/lib/supabase/server';

export interface WellnessEntry {
  id:string;userId:string;entryDate:string;sleepHours?:number;energyRating:'LOW'|'NORMAL'|'HIGH';
  moodRating:'LOW'|'NEUTRAL'|'GOOD'|'EXCELLENT';workoutCompleted:boolean;notes?:string;createdAt:string;
}
function mapEntry(data:any):WellnessEntry{return{
  id:data.id,userId:data.user_id,entryDate:data.entry_date,sleepHours:data.sleep_hours===null?undefined:Number(data.sleep_hours),
  energyRating:data.energy_rating,moodRating:data.mood_rating,workoutCompleted:Boolean(data.workout_completed),
  notes:data.notes||undefined,createdAt:data.created_at
};}

export async function logDailyWellness(userId:string,entry:{sleepHours?:number;energyRating?:WellnessEntry['energyRating'];moodRating?:WellnessEntry['moodRating'];workoutCompleted?:boolean;notes?:string}):Promise<{success:boolean;message:string}>{
  const supabase=createClient();
  const today=new Date().toISOString().split('T')[0];
  const {error}=await supabase.from('wellness_entries').upsert({
    user_id:userId,entry_date:today,sleep_hours:entry.sleepHours??null,
    energy_rating:entry.energyRating||'NORMAL',mood_rating:entry.moodRating||'NEUTRAL',
    workout_completed:entry.workoutCompleted??false,notes:entry.notes||null
  },{onConflict:'user_id,entry_date'});
  if(error)throw new Error(error.message);
  return{success:true,message:'Wellness entry saved.'};
}

export async function getTodayWellness(userId:string):Promise<WellnessEntry|null>{
  const supabase=createClient();
  const today=new Date().toISOString().split('T')[0];
  const {data,error}=await supabase.from('wellness_entries').select('*').eq('user_id',userId).eq('entry_date',today).maybeSingle();
  if(error)throw new Error(error.message);
  return data?mapEntry(data):null;
}
