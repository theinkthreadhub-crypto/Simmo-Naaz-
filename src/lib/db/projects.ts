import { createClient } from '@/lib/supabase/server';

export interface Project {
  id:string; userId:string; title:string; description?:string; objective:string;
  status:'ACTIVE'|'ON_TRACK'|'AT_RISK'|'BLOCKED'|'PAUSED'|'COMPLETE';
  health:string; priority:'LOW'|'MEDIUM'|'HIGH'|'URGENT'; targetDate?:string;
  relatedGoalId?:string; collaborators:Array<{name:string;role:string;email?:string}>;
  financeBudget:number; financeSpent:number; nextAction?:string; createdAt:string;
}
export interface Decision {
  id:string; userId:string; projectId?:string; title:string; rationale:string;
  alternatives:string[]; expectedOutcome?:string; actualOutcome?:string;
  status:'DECIDED'|'EVALUATED'|'REVISED'; source:string; decidedAt:string;
}

function mapProject(d:any):Project{return{
  id:d.id,userId:d.user_id,title:d.title,description:d.description||'',objective:d.objective,status:d.status,
  health:d.health,priority:d.priority,targetDate:d.target_date||undefined,relatedGoalId:d.related_goal_id||undefined,
  collaborators:d.collaborators||[],financeBudget:Number(d.finance_budget||0),financeSpent:Number(d.finance_spent||0),
  nextAction:d.next_action||undefined,createdAt:d.created_at
};}
function mapDecision(d:any):Decision{return{
  id:d.id,userId:d.user_id,projectId:d.project_id||undefined,title:d.title,rationale:d.rationale,
  alternatives:d.alternatives||[],expectedOutcome:d.expected_outcome||undefined,actualOutcome:d.actual_outcome||undefined,
  status:d.status,source:d.source,decidedAt:d.decided_at
};}

export async function createProject(userId:string,proj:{title:string;description?:string;objective:string;targetDate?:string;relatedGoalId?:string;financeBudget?:number;nextAction?:string}):Promise<Project>{
  const supabase=createClient();
  const {data,error}=await supabase.from('projects').insert({
    user_id:userId,title:proj.title,description:proj.description||'',objective:proj.objective,
    status:'ACTIVE',health:'ON_TRACK',priority:'HIGH',target_date:proj.targetDate||null,
    related_goal_id:proj.relatedGoalId||null,collaborators:[],finance_budget:Number(proj.financeBudget||0),
    finance_spent:0,next_action:proj.nextAction||null
  }).select().single();
  if(error||!data)throw new Error(error?.message||'Failed to create project.');
  return mapProject(data);
}

export async function recordDecision(userId:string,decision:{projectId?:string;title:string;rationale:string;alternatives?:string[];expectedOutcome?:string}):Promise<Decision>{
  const supabase=createClient();
  const {data,error}=await supabase.from('decisions').insert({
    user_id:userId,project_id:decision.projectId||null,title:decision.title,rationale:decision.rationale,
    alternatives:decision.alternatives||[],expected_outcome:decision.expectedOutcome||null,status:'DECIDED',source:'OPERATOR'
  }).select().single();
  if(error||!data)throw new Error(error?.message||'Failed to record decision.');
  return mapDecision(data);
}

export async function listUserProjects(userId:string):Promise<Project[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('projects').select('*').eq('user_id',userId).order('created_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]).map(mapProject);
}

export async function listDecisions(userId:string,projectId?:string):Promise<Decision[]>{
  const supabase=createClient();
  let query=supabase.from('decisions').select('*').eq('user_id',userId);
  if(projectId)query=query.eq('project_id',projectId);
  const {data,error}=await query.order('decided_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]).map(mapDecision);
}

export const getProjects=listUserProjects;
export const getDecisions=listDecisions;
