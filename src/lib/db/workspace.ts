import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceRole, WorkspaceType, PermissionKey, hasPermission } from '../workspace/rbac';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  owner_id: string;
  business_id?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  created_at?: string;
  updated_at?: string;
}
export interface WorkspaceMember {
  id: string; workspace_id: string; user_id: string; role: WorkspaceRole;
  status: 'INVITED'|'ACTIVE'|'SUSPENDED'|'REMOVED';
  invited_by?: string|null; joined_at?: string; last_active_at?: string; created_at?: string; updated_at?: string;
}
export interface WorkspaceInvitation {
  id:string; workspace_id:string; email:string; role:WorkspaceRole; token:string;
  status:'PENDING'|'ACCEPTED'|'EXPIRED'|'REVOKED'; invited_by:string; expires_at:string; created_at?:string; updated_at?:string;
}
export interface WorkspaceTask {
  id:string; workspace_id:string; project_id?:string|null; campaign_id?:string|null; title:string; description?:string|null;
  created_by:string; assigned_to?:string|null; priority:'LOW'|'NORMAL'|'HIGH'|'LAUNCH_CRITICAL'; due_date?:string|null;
  status:'TODO'|'IN_PROGRESS'|'BLOCKED'|'REVIEW'|'COMPLETE'|'CANCELLED'; blocker_reason?:string|null; review_required:boolean;
  created_at?:string; updated_at?:string;
}
export interface WorkspaceComment {
  id:string; workspace_id:string; task_id?:string|null; project_id?:string|null; campaign_id?:string|null; user_id:string;
  content:string; mentions?:string[]; created_at?:string;
}
export interface WorkspaceActivity {
  id:string; workspace_id:string; actor_id:string; action:string; resource_type:string; resource_id:string;
  details?:Record<string,unknown>; created_at?:string;
}
export interface WorkspaceApprovalPolicy {
  id:string; workspace_id:string; action_type:string; min_role:WorkspaceRole; requires_review:boolean;
}
export interface WorkspaceMemory {
  id:string; workspace_id:string;
  category:'BUSINESS_DECISION'|'SUPPLIER_CONTEXT'|'CAMPAIGN_LEARNING'|'PRODUCT_INSIGHT'|'PROCESS'|'POLICY'|'PROJECT_CONTEXT'|'TEAM_DECISION';
  content:string; confidence:number; source?:string|null; created_by:string; created_at?:string;
}

export async function createWorkspace(data:{name:string;type:WorkspaceType;owner_id:string;business_id?:string|null}):Promise<Workspace>{
  const supabase=createClient();
  const {data:workspace,error}=await supabase.from('workspaces').insert({
    name:data.name,type:data.type,owner_id:data.owner_id,business_id:data.business_id||null,status:'ACTIVE'
  }).select().single();
  if(error||!workspace)throw new Error(error?.message||'Failed to create workspace.');

  const {error:memberError}=await supabase.from('workspace_members').insert({
    workspace_id:workspace.id,user_id:data.owner_id,role:'OWNER',status:'ACTIVE'
  });
  if(memberError){
    await supabase.from('workspaces').delete().eq('id',workspace.id).eq('owner_id',data.owner_id);
    throw new Error(memberError.message);
  }
  await logWorkspaceActivity({workspace_id:workspace.id,actor_id:data.owner_id,action:'WORKSPACE_CREATED',resource_type:'WORKSPACE',resource_id:workspace.id,details:{name:data.name,type:data.type}});
  return workspace as Workspace;
}

export async function getWorkspaceById(id:string):Promise<Workspace|null>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspaces').select('*').eq('id',id).maybeSingle();
  if(error)throw new Error(error.message);
  return data as Workspace|null;
}

export async function getUserWorkspaces(_userId:string):Promise<Workspace[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspaces').select('*').eq('status','ACTIVE').order('created_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]) as Workspace[];
}

export async function getWorkspaceMember(workspaceId:string,userId:string):Promise<WorkspaceMember|null>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspace_members').select('*').eq('workspace_id',workspaceId).eq('user_id',userId).maybeSingle();
  if(error)throw new Error(error.message);
  return data as WorkspaceMember|null;
}

export async function getWorkspaceMembers(workspaceId:string):Promise<WorkspaceMember[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspace_members').select('*').eq('workspace_id',workspaceId).neq('status','REMOVED').order('created_at',{ascending:true});
  if(error)throw new Error(error.message);
  return (data||[]) as WorkspaceMember[];
}

export async function updateMemberRole(workspaceId:string,targetUserId:string,newRole:WorkspaceRole,actorId:string):Promise<boolean>{
  const supabase=createClient();
  const member=await getWorkspaceMember(workspaceId,targetUserId);
  if(!member)return false;
  const oldRole=member.role;
  const {error}=await supabase.from('workspace_members').update({role:newRole,updated_at:new Date().toISOString()}).eq('workspace_id',workspaceId).eq('user_id',targetUserId);
  if(error)throw new Error(error.message);
  await logWorkspaceActivity({workspace_id:workspaceId,actor_id:actorId,action:'MEMBER_ROLE_UPDATED',resource_type:'MEMBER',resource_id:targetUserId,details:{oldRole,newRole}});
  return true;
}

export async function removeWorkspaceMember(workspaceId:string,targetUserId:string,actorId:string):Promise<boolean>{
  const supabase=createClient();
  const member=await getWorkspaceMember(workspaceId,targetUserId);
  if(!member)return false;
  if(member.role==='OWNER')throw new Error('Workspace owner cannot be removed.');
  const {error}=await supabase.from('workspace_members').update({status:'REMOVED',updated_at:new Date().toISOString()}).eq('workspace_id',workspaceId).eq('user_id',targetUserId);
  if(error)throw new Error(error.message);
  await logWorkspaceActivity({workspace_id:workspaceId,actor_id:actorId,action:'MEMBER_REMOVED',resource_type:'MEMBER',resource_id:targetUserId});
  return true;
}

export async function createInvitation(data:{workspace_id:string;email:string;role:WorkspaceRole;invited_by:string;expiresInDays?:number}):Promise<WorkspaceInvitation>{
  const supabase=createClient();
  const token=crypto.randomBytes(32).toString('hex');
  const expires_at=new Date(Date.now()+(data.expiresInDays||7)*86400000).toISOString();
  const {data:row,error}=await supabase.from('workspace_invitations').insert({
    workspace_id:data.workspace_id,email:data.email.trim().toLowerCase(),role:data.role,token,status:'PENDING',invited_by:data.invited_by,expires_at
  }).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to create invitation.');
  await logWorkspaceActivity({workspace_id:data.workspace_id,actor_id:data.invited_by,action:'INVITATION_CREATED',resource_type:'INVITATION',resource_id:row.id,details:{email:row.email,role:row.role}});
  return row as WorkspaceInvitation;
}

export async function acceptInvitation(token:string,userId:string):Promise<{success:boolean;error?:string;workspace_id?:string}>{
  const supabase=createClient();
  const {data:invitation,error}=await supabase.from('workspace_invitations').select('*').eq('token',token).maybeSingle();
  if(error)return{success:false,error:error.message};
  if(!invitation)return{success:false,error:'INVALID_TOKEN'};
  if(invitation.status!=='PENDING')return{success:false,error:'TOKEN_ALREADY_USED_OR_REVOKED'};
  if(new Date(invitation.expires_at).getTime()<Date.now())return{success:false,error:'TOKEN_EXPIRED'};

  const {error:updateError}=await supabase.from('workspace_invitations').update({status:'ACCEPTED',updated_at:new Date().toISOString()}).eq('id',invitation.id).eq('status','PENDING');
  if(updateError)return{success:false,error:updateError.message};

  const {error:memberError}=await supabase.from('workspace_members').upsert({
    workspace_id:invitation.workspace_id,user_id:userId,role:invitation.role,status:'ACTIVE',invited_by:invitation.invited_by,joined_at:new Date().toISOString(),last_active_at:new Date().toISOString()
  },{onConflict:'workspace_id,user_id'});
  if(memberError)return{success:false,error:memberError.message};

  await logWorkspaceActivity({workspace_id:invitation.workspace_id,actor_id:userId,action:'INVITATION_ACCEPTED',resource_type:'MEMBER',resource_id:userId,details:{role:invitation.role}});
  return{success:true,workspace_id:invitation.workspace_id};
}

export async function can(userId:string,action:PermissionKey,workspaceId:string):Promise<boolean>{
  const member=await getWorkspaceMember(workspaceId,userId);
  return Boolean(member&&member.status==='ACTIVE'&&hasPermission(member.role,action));
}

export async function createWorkspaceTask(data:{workspace_id:string;project_id?:string|null;campaign_id?:string|null;title:string;description?:string|null;created_by:string;assigned_to?:string|null;priority?:WorkspaceTask['priority'];due_date?:string|null;review_required?:boolean}):Promise<WorkspaceTask>{
  const supabase=createClient();
  const {data:row,error}=await supabase.from('workspace_tasks').insert({
    workspace_id:data.workspace_id,project_id:data.project_id||null,campaign_id:data.campaign_id||null,title:data.title,
    description:data.description||null,created_by:data.created_by,assigned_to:data.assigned_to||null,priority:data.priority||'NORMAL',
    due_date:data.due_date||null,status:'TODO',review_required:data.review_required||false
  }).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to create workspace task.');
  await logWorkspaceActivity({workspace_id:data.workspace_id,actor_id:data.created_by,action:'TASK_CREATED',resource_type:'TASK',resource_id:row.id,details:{title:data.title,assigned_to:data.assigned_to}});
  return row as WorkspaceTask;
}

export async function getWorkspaceTasks(workspaceId:string):Promise<WorkspaceTask[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspace_tasks').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]) as WorkspaceTask[];
}

export async function updateWorkspaceTaskStatus(taskId:string,status:WorkspaceTask['status'],actorId:string,blockerReason?:string):Promise<WorkspaceTask|null>{
  const supabase=createClient();
  const {data:current,error:lookupError}=await supabase.from('workspace_tasks').select('*').eq('id',taskId).maybeSingle();
  if(lookupError)throw new Error(lookupError.message);
  if(!current)return null;
  const {data:row,error}=await supabase.from('workspace_tasks').update({status,blocker_reason:blockerReason??current.blocker_reason,updated_at:new Date().toISOString()}).eq('id',taskId).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to update task.');
  await logWorkspaceActivity({workspace_id:current.workspace_id,actor_id:actorId,action:'TASK_STATUS_UPDATED',resource_type:'TASK',resource_id:taskId,details:{status,blockerReason}});
  return row as WorkspaceTask;
}

export async function addWorkspaceComment(data:{workspace_id:string;task_id?:string|null;project_id?:string|null;campaign_id?:string|null;user_id:string;content:string;mentions?:string[]}):Promise<WorkspaceComment>{
  const supabase=createClient();
  const {data:row,error}=await supabase.from('workspace_comments').insert({
    workspace_id:data.workspace_id,task_id:data.task_id||null,project_id:data.project_id||null,campaign_id:data.campaign_id||null,
    user_id:data.user_id,content:data.content,mentions:data.mentions||[]
  }).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to add comment.');
  await logWorkspaceActivity({workspace_id:data.workspace_id,actor_id:data.user_id,action:'COMMENT_ADDED',resource_type:'COMMENT',resource_id:row.id,details:{task_id:data.task_id,mentions:data.mentions}});
  return row as WorkspaceComment;
}

export async function saveWorkspaceMemory(data:{workspace_id:string;category:WorkspaceMemory['category'];content:string;confidence?:number;source?:string|null;created_by:string}):Promise<WorkspaceMemory>{
  const supabase=createClient();
  const {data:row,error}=await supabase.from('workspace_memories').insert({
    workspace_id:data.workspace_id,category:data.category,content:data.content,confidence:data.confidence??0.9,source:data.source||null,created_by:data.created_by
  }).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to save workspace memory.');
  await logWorkspaceActivity({workspace_id:data.workspace_id,actor_id:data.created_by,action:'MEMORY_SAVED',resource_type:'MEMORY',resource_id:row.id,details:{category:data.category}});
  return row as WorkspaceMemory;
}

export async function getWorkspaceMemories(workspaceId:string):Promise<WorkspaceMemory[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspace_memories').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false});
  if(error)throw new Error(error.message);
  return (data||[]) as WorkspaceMemory[];
}

export async function logWorkspaceActivity(data:{workspace_id:string;actor_id:string;action:string;resource_type:string;resource_id:string;details?:Record<string,unknown>}):Promise<WorkspaceActivity>{
  const supabase=createClient();
  const {data:row,error}=await supabase.from('workspace_activity').insert({
    workspace_id:data.workspace_id,actor_id:data.actor_id,action:data.action,resource_type:data.resource_type,resource_id:data.resource_id,details:data.details||{}
  }).select().single();
  if(error||!row)throw new Error(error?.message||'Failed to log workspace activity.');
  return row as WorkspaceActivity;
}

export async function getWorkspaceActivity(workspaceId:string):Promise<WorkspaceActivity[]>{
  const supabase=createClient();
  const {data,error}=await supabase.from('workspace_activity').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(50);
  if(error)throw new Error(error.message);
  return (data||[]) as WorkspaceActivity[];
}
