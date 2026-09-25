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
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  invited_by?: string | null;
  joined_at?: string;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invited_by: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceTask {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  campaign_id?: string | null;
  title: string;
  description?: string | null;
  created_by: string;
  assigned_to?: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'LAUNCH_CRITICAL';
  due_date?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'COMPLETE' | 'CANCELLED';
  blocker_reason?: string | null;
  review_required: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceComment {
  id: string;
  workspace_id: string;
  task_id?: string | null;
  project_id?: string | null;
  campaign_id?: string | null;
  user_id: string;
  content: string;
  mentions?: string[];
  created_at?: string;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

export interface WorkspaceApprovalPolicy {
  id: string;
  workspace_id: string;
  action_type: string;
  min_role: WorkspaceRole;
  requires_review: boolean;
}

export interface WorkspaceMemory {
  id: string;
  workspace_id: string;
  category: 'BUSINESS_DECISION' | 'SUPPLIER_CONTEXT' | 'CAMPAIGN_LEARNING' | 'PRODUCT_INSIGHT' | 'PROCESS' | 'POLICY' | 'PROJECT_CONTEXT' | 'TEAM_DECISION';
  content: string;
  confidence: number;
  source?: string | null;
  created_by: string;
  created_at?: string;
}

// In-Memory Storage for deterministic evaluations & fast local fallback
const inMemoryWorkspaces = new Map<string, Workspace>();
const inMemoryMembers = new Map<string, WorkspaceMember>();
const inMemoryInvitations = new Map<string, WorkspaceInvitation>();
const inMemoryTasks = new Map<string, WorkspaceTask>();
const inMemoryComments = new Map<string, WorkspaceComment>();
const inMemoryActivity: WorkspaceActivity[] = [];
const inMemoryPolicies = new Map<string, WorkspaceApprovalPolicy>();
const inMemoryMemories = new Map<string, WorkspaceMemory>();

function getSafeSupabaseClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

// ==========================================
// 1. WORKSPACES & MEMBERSHIP
// ==========================================

export async function createWorkspace(data: {
  name: string;
  type: WorkspaceType;
  owner_id: string;
  business_id?: string | null;
}): Promise<Workspace> {
  const id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const ws: Workspace = {
    id,
    name: data.name,
    type: data.type,
    owner_id: data.owner_id,
    business_id: data.business_id ?? null,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
  };
  inMemoryWorkspaces.set(id, ws);

  // Automatically add owner as active member
  const memberId = `wsm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const ownerMember: WorkspaceMember = {
    id: memberId,
    workspace_id: id,
    user_id: data.owner_id,
    role: 'OWNER',
    status: 'ACTIVE',
    joined_at: now,
    last_active_at: now,
    created_at: now,
    updated_at: now,
  };
  inMemoryMembers.set(memberId, ownerMember);

  // Async sync to Supabase
  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspaces').insert(ws)).catch(() => {});
    Promise.resolve(client.from('workspace_members').insert(ownerMember)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: id,
    actor_id: data.owner_id,
    action: 'WORKSPACE_CREATED',
    resource_type: 'WORKSPACE',
    resource_id: id,
    details: { name: data.name, type: data.type },
  });

  return ws;
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const ws = inMemoryWorkspaces.get(id);
  if (ws) return ws;
  const client = getSafeSupabaseClient();
  if (!client) return null;
  const { data } = await client.from('workspaces').select('*').eq('id', id).maybeSingle();
  if (data) {
    inMemoryWorkspaces.set(data.id, data);
    return data;
  }
  return null;
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const userMemberships = Array.from(inMemoryMembers.values()).filter(
    m => m.user_id === userId && m.status === 'ACTIVE'
  );
  const wsIds = new Set(userMemberships.map(m => m.workspace_id));
  const results = Array.from(inMemoryWorkspaces.values()).filter(
    ws => ws.owner_id === userId || wsIds.has(ws.id)
  );

  if (results.length > 0) return results;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');
    if (data) {
      return data.map((d: any) => d.workspaces).filter(Boolean);
    }
  }
  return [];
}

export async function getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
  const member = Array.from(inMemoryMembers.values()).find(
    m => m.workspace_id === workspaceId && m.user_id === userId
  );
  if (member) return member;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      inMemoryMembers.set(data.id, data);
      return data;
    }
  }
  return null;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const local = Array.from(inMemoryMembers.values()).filter(m => m.workspace_id === workspaceId);
  if (local.length > 0) return local;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    if (data) return data;
  }
  return [];
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  actorId: string
): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, targetUserId);
  if (!member) return false;

  const oldRole = member.role;
  member.role = newRole;
  member.updated_at = new Date().toISOString();
  inMemoryMembers.set(member.id, member);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_members').update({ role: newRole, updated_at: member.updated_at }).eq('id', member.id)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: workspaceId,
    actor_id: actorId,
    action: 'MEMBER_ROLE_UPDATED',
    resource_type: 'MEMBER',
    resource_id: targetUserId,
    details: { oldRole, newRole },
  });

  return true;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  targetUserId: string,
  actorId: string
): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, targetUserId);
  if (!member) return false;

  member.status = 'REMOVED';
  member.updated_at = new Date().toISOString();
  inMemoryMembers.set(member.id, member);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_members').update({ status: 'REMOVED', updated_at: member.updated_at }).eq('id', member.id)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: workspaceId,
    actor_id: actorId,
    action: 'MEMBER_REMOVED',
    resource_type: 'MEMBER',
    resource_id: targetUserId,
  });

  return true;
}

// ==========================================
// 2. INVITATION ENGINE
// ==========================================

export async function createInvitation(data: {
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  expiresInDays?: number;
}): Promise<WorkspaceInvitation> {
  const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  const days = data.expiresInDays || 7;
  const expires_at = new Date(Date.now() + days * 86400000).toISOString();
  const now = new Date().toISOString();

  const invitation: WorkspaceInvitation = {
    id,
    workspace_id: data.workspace_id,
    email: data.email.toLowerCase(),
    role: data.role,
    token,
    status: 'PENDING',
    invited_by: data.invited_by,
    expires_at,
    created_at: now,
    updated_at: now,
  };

  inMemoryInvitations.set(token, invitation);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_invitations').insert(invitation)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: data.workspace_id,
    actor_id: data.invited_by,
    action: 'INVITATION_CREATED',
    resource_type: 'INVITATION',
    resource_id: id,
    details: { email: data.email, role: data.role },
  });

  return invitation;
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; workspace_id?: string }> {
  const invitation = inMemoryInvitations.get(token);
  if (!invitation) return { success: false, error: 'INVALID_TOKEN' };
  if (invitation.status !== 'PENDING') return { success: false, error: 'TOKEN_ALREADY_USED_OR_REVOKED' };
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    invitation.status = 'EXPIRED';
    return { success: false, error: 'TOKEN_EXPIRED' };
  }

  // Mark token accepted
  invitation.status = 'ACCEPTED';
  invitation.updated_at = new Date().toISOString();
  inMemoryInvitations.set(token, invitation);

  // Add member
  const memberId = `wsm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newMember: WorkspaceMember = {
    id: memberId,
    workspace_id: invitation.workspace_id,
    user_id: userId,
    role: invitation.role,
    status: 'ACTIVE',
    invited_by: invitation.invited_by,
    joined_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  inMemoryMembers.set(memberId, newMember);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_invitations').update({ status: 'ACCEPTED' }).eq('id', invitation.id)).catch(() => {});
    Promise.resolve(client.from('workspace_members').insert(newMember)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: invitation.workspace_id,
    actor_id: userId,
    action: 'INVITATION_ACCEPTED',
    resource_type: 'MEMBER',
    resource_id: memberId,
    details: { role: invitation.role },
  });

  return { success: true, workspace_id: invitation.workspace_id };
}

// ==========================================
// 3. CAPABILITY CHECK (can)
// ==========================================

export async function can(
  userId: string,
  action: PermissionKey,
  workspaceId: string
): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member || member.status !== 'ACTIVE') return false;
  return hasPermission(member.role, action);
}

// ==========================================
// 4. WORKSPACE TASKS & DELEGATION
// ==========================================

export async function createWorkspaceTask(data: {
  workspace_id: string;
  project_id?: string | null;
  campaign_id?: string | null;
  title: string;
  description?: string | null;
  created_by: string;
  assigned_to?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'LAUNCH_CRITICAL';
  due_date?: string | null;
  review_required?: boolean;
}): Promise<WorkspaceTask> {
  const id = `wst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const task: WorkspaceTask = {
    id,
    workspace_id: data.workspace_id,
    project_id: data.project_id ?? null,
    campaign_id: data.campaign_id ?? null,
    title: data.title,
    description: data.description ?? null,
    created_by: data.created_by,
    assigned_to: data.assigned_to ?? null,
    priority: data.priority || 'NORMAL',
    due_date: data.due_date ?? null,
    status: 'TODO',
    blocker_reason: null,
    review_required: data.review_required ?? false,
    created_at: now,
    updated_at: now,
  };

  inMemoryTasks.set(id, task);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_tasks').insert(task)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: data.workspace_id,
    actor_id: data.created_by,
    action: 'TASK_CREATED',
    resource_type: 'TASK',
    resource_id: id,
    details: { title: data.title, assigned_to: data.assigned_to },
  });

  return task;
}

export async function getWorkspaceTasks(workspaceId: string): Promise<WorkspaceTask[]> {
  const local = Array.from(inMemoryTasks.values()).filter(t => t.workspace_id === workspaceId);
  if (local.length > 0) return local;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_tasks').select('*').eq('workspace_id', workspaceId);
    if (data) return data;
  }
  return [];
}

export async function updateWorkspaceTaskStatus(
  taskId: string,
  status: WorkspaceTask['status'],
  actorId: string,
  blockerReason?: string
): Promise<WorkspaceTask | null> {
  const task = inMemoryTasks.get(taskId);
  if (!task) return null;

  const updatedTask = {
    ...task,
    status,
    blocker_reason: blockerReason !== undefined ? blockerReason : task.blocker_reason,
    updated_at: new Date().toISOString(),
  };
  inMemoryTasks.set(taskId, updatedTask);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_tasks').update({
      status: updatedTask.status,
      blocker_reason: updatedTask.blocker_reason,
      updated_at: updatedTask.updated_at,
    }).eq('id', taskId)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: task.workspace_id,
    actor_id: actorId,
    action: 'TASK_STATUS_UPDATED',
    resource_type: 'TASK',
    resource_id: taskId,
    details: { status, blockerReason },
  });

  return updatedTask;
}

// ==========================================
// 5. COMMENTS & @MENTIONS
// ==========================================

export async function addWorkspaceComment(data: {
  workspace_id: string;
  task_id?: string | null;
  project_id?: string | null;
  campaign_id?: string | null;
  user_id: string;
  content: string;
  mentions?: string[];
}): Promise<WorkspaceComment> {
  const id = `wsc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const comment: WorkspaceComment = {
    id,
    workspace_id: data.workspace_id,
    task_id: data.task_id ?? null,
    project_id: data.project_id ?? null,
    campaign_id: data.campaign_id ?? null,
    user_id: data.user_id,
    content: data.content,
    mentions: data.mentions || [],
    created_at: new Date().toISOString(),
  };

  inMemoryComments.set(id, comment);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_comments').insert(comment)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: data.workspace_id,
    actor_id: data.user_id,
    action: 'COMMENT_ADDED',
    resource_type: 'COMMENT',
    resource_id: id,
    details: { task_id: data.task_id, mentions: data.mentions },
  });

  return comment;
}

// ==========================================
// 6. WORKSPACE MEMORY VAULT
// ==========================================

export async function saveWorkspaceMemory(data: {
  workspace_id: string;
  category: WorkspaceMemory['category'];
  content: string;
  confidence?: number;
  source?: string | null;
  created_by: string;
}): Promise<WorkspaceMemory> {
  const id = `wsmem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const memory: WorkspaceMemory = {
    id,
    workspace_id: data.workspace_id,
    category: data.category,
    content: data.content,
    confidence: data.confidence ?? 0.90,
    source: data.source ?? null,
    created_by: data.created_by,
    created_at: new Date().toISOString(),
  };

  inMemoryMemories.set(id, memory);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_memories').insert(memory)).catch(() => {});
  }

  logWorkspaceActivity({
    workspace_id: data.workspace_id,
    actor_id: data.created_by,
    action: 'MEMORY_SAVED',
    resource_type: 'MEMORY',
    resource_id: id,
    details: { category: data.category },
  });

  return memory;
}

export async function getWorkspaceMemories(workspaceId: string): Promise<WorkspaceMemory[]> {
  const local = Array.from(inMemoryMemories.values()).filter(m => m.workspace_id === workspaceId);
  if (local.length > 0) return local;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_memories').select('*').eq('workspace_id', workspaceId);
    if (data) return data;
  }
  return [];
}

// ==========================================
// 7. ACTIVITY & AUDIT TRAIL
// ==========================================

export function logWorkspaceActivity(data: {
  workspace_id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
}): WorkspaceActivity {
  const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const activity: WorkspaceActivity = {
    id,
    workspace_id: data.workspace_id,
    actor_id: data.actor_id,
    action: data.action,
    resource_type: data.resource_type,
    resource_id: data.resource_id,
    details: data.details || {},
    created_at: new Date().toISOString(),
  };

  inMemoryActivity.unshift(activity);

  const client = getSafeSupabaseClient();
  if (client) {
    Promise.resolve(client.from('workspace_activity').insert(activity)).catch(() => {});
  }

  return activity;
}

export async function getWorkspaceActivity(workspaceId: string): Promise<WorkspaceActivity[]> {
  const local = inMemoryActivity.filter(a => a.workspace_id === workspaceId);
  if (local.length > 0) return local;

  const client = getSafeSupabaseClient();
  if (client) {
    const { data } = await client.from('workspace_activity')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) return data;
  }
  return [];
}
