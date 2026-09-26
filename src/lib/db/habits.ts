import { createClient } from '@/lib/supabase/server';
import { addXPServer } from '@/lib/progression/playerProgression';

export interface Habit {
  id:string;userId:string;title:string;description?:string;lifeArea:string;
  frequency:'DAILY'|'WEEKDAYS'|'WEEKLY'|'CUSTOM';targetCount:number;preferredTime?:string;
  difficulty:'EASY'|'MEDIUM'|'HARD';relatedGoalId?:string;relatedSkillId?:string;
  status:'ACTIVE'|'ARCHIVED';xpReward:number;currentStreak?:number;completedToday?:boolean;createdAt:string;
}
export interface HabitCompletion {
  id:string;habitId:string;userId:string;completionDate:string;completedAt:string;notes?:string;source:string;xpAwarded:number;
}

function mapHabit(h:any,completedToday=false):Habit{return{
  id:h.id,userId:h.user_id,title:h.title,description:h.description||'',lifeArea:h.life_area,
  frequency:h.frequency,targetCount:Number(h.target_count||1),preferredTime:h.preferred_time||undefined,
  difficulty:h.difficulty,relatedGoalId:h.related_goal_id||undefined,relatedSkillId:h.related_skill_id||undefined,
  status:h.status,xpReward:Number(h.xp_reward||0),completedToday,createdAt:h.created_at
};}

export async function createHabit(userId:string,habit:{
  title:string;description?:string;lifeArea?:string;frequency?:Habit['frequency'];targetCount?:number;
  preferredTime?:string;difficulty?:Habit['difficulty'];relatedGoalId?:string;relatedSkillId?:string;xpReward?:number;
}):Promise<Habit>{
  const supabase=createClient();
  const {data,error}=await supabase.from('habits').insert({
    user_id:userId,title:habit.title,description:habit.description||'',life_area:habit.lifeArea||'Personal Growth',
    frequency:habit.frequency||'DAILY',target_count:Number(habit.targetCount||1),preferred_time:habit.preferredTime||null,
    difficulty:habit.difficulty||'MEDIUM',related_goal_id:habit.relatedGoalId||null,
    related_skill_id:habit.relatedSkillId||null,status:'ACTIVE',xp_reward:Math.max(0,Number(habit.xpReward??15))
  }).select().single();
  if(error||!data)throw new Error(error?.message||'Failed to create habit.');
  return mapHabit(data);
}

export async function completeHabitToday(userId:string,habitId:string,source='WEB'):Promise<{success:boolean;message:string;xpAwarded:number}>{
  const supabase=createClient();
  const today=new Date().toISOString().split('T')[0];

  const {data:habit,error:habitError}=await supabase.from('habits').select('*').eq('id',habitId).eq('user_id',userId).eq('status','ACTIVE').maybeSingle();
  if(habitError)throw new Error(habitError.message);
  if(!habit)return{success:false,message:'Habit not found.',xpAwarded:0};

  const xpReward=Math.max(0,Number(habit.xp_reward||0));
  const {data:completion,error}=await supabase.from('habit_completions').insert({
    habit_id:habitId,user_id:userId,completion_date:today,source,xp_awarded:xpReward
  }).select().single();

  if(error){
    if(error.code==='23505')return{success:false,message:'Habit already completed today.',xpAwarded:0};
    throw new Error(error.message);
  }

  if(xpReward>0){
    const xp=await addXPServer(userId,xpReward,'ACHIEVEMENT',`habit_${completion.id}`,`Completed habit: ${habit.title}`);
    if(!xp.success&&xp.error!=='Reward already awarded for this action.')throw new Error(xp.error||'XP_AWARD_FAILED');
  }

  return{success:true,message:`Habit completed. +${xpReward} XP.`,xpAwarded:xpReward};
}

export async function listUserHabits(userId:string):Promise<Habit[]>{
  const supabase=createClient();
  const today=new Date().toISOString().split('T')[0];
  const [{data:habits,error:habitError},{data:completions,error:completionError}]=await Promise.all([
    supabase.from('habits').select('*').eq('user_id',userId).eq('status','ACTIVE').order('created_at',{ascending:false}),
    supabase.from('habit_completions').select('habit_id').eq('user_id',userId).eq('completion_date',today)
  ]);
  if(habitError)throw new Error(habitError.message);
  if(completionError)throw new Error(completionError.message);
  const completed=new Set((completions||[]).map((c:any)=>c.habit_id));
  return(habits||[]).map((h:any)=>mapHabit(h,completed.has(h.id)));
}
export const getHabits=listUserHabits;
export const completeHabit=(habitId:string,userId:string,source='WEB')=>completeHabitToday(userId,habitId,source);
