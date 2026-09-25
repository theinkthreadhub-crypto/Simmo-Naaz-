/**
 * MENTRA PHASE 13: ROLE-BASED ACCESS CONTROL & PERMISSION ENGINE
 * 
 * Centralized capability checking to prevent unauthorized workspace access,
 * enforce privilege separation, and protect private user records.
 */

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EDITOR' | 'MEMBER' | 'VIEWER';

export type WorkspaceType = 'PERSONAL' | 'BUSINESS' | 'TEAM';

export type PermissionKey =
  | 'workspace.view'
  | 'workspace.manage'
  | 'workspace.delete'
  | 'members.view'
  | 'members.invite'
  | 'members.manage'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'tasks.create'
  | 'tasks.assign'
  | 'tasks.complete'
  | 'tasks.review'
  | 'campaigns.view'
  | 'campaigns.edit'
  | 'content.create'
  | 'content.edit'
  | 'content.approve'
  | 'content.publish'
  | 'finance.view'
  | 'finance.edit'
  | 'agents.use'
  | 'agents.manage'
  | 'integrations.view'
  | 'integrations.manage'
  | 'approvals.review'
  | 'reports.view'
  | 'memory.view'
  | 'memory.write';

// Canonical Capability Mapping
export const ROLE_PERMISSIONS: Record<WorkspaceRole, PermissionKey[]> = {
  OWNER: [
    'workspace.view',
    'workspace.manage',
    'workspace.delete',
    'members.view',
    'members.invite',
    'members.manage',
    'projects.create',
    'projects.edit',
    'projects.delete',
    'tasks.create',
    'tasks.assign',
    'tasks.complete',
    'tasks.review',
    'campaigns.view',
    'campaigns.edit',
    'content.create',
    'content.edit',
    'content.approve',
    'content.publish',
    'finance.view',
    'finance.edit',
    'agents.use',
    'agents.manage',
    'integrations.view',
    'integrations.manage',
    'approvals.review',
    'reports.view',
    'memory.view',
    'memory.write',
  ],
  ADMIN: [
    'workspace.view',
    'workspace.manage',
    'members.view',
    'members.invite',
    'members.manage',
    'projects.create',
    'projects.edit',
    'tasks.create',
    'tasks.assign',
    'tasks.complete',
    'tasks.review',
    'campaigns.view',
    'campaigns.edit',
    'content.create',
    'content.edit',
    'content.approve',
    'content.publish',
    'finance.view',
    'agents.use',
    'agents.manage',
    'integrations.view',
    'approvals.review',
    'reports.view',
    'memory.view',
    'memory.write',
  ],
  MANAGER: [
    'workspace.view',
    'members.view',
    'projects.create',
    'projects.edit',
    'tasks.create',
    'tasks.assign',
    'tasks.complete',
    'tasks.review',
    'campaigns.view',
    'campaigns.edit',
    'content.create',
    'content.edit',
    'content.approve',
    'finance.view',
    'agents.use',
    'approvals.review',
    'reports.view',
    'memory.view',
    'memory.write',
  ],
  EDITOR: [
    'workspace.view',
    'members.view',
    'projects.create',
    'tasks.create',
    'tasks.complete',
    'campaigns.view',
    'content.create',
    'content.edit',
    'agents.use',
    'reports.view',
    'memory.view',
  ],
  MEMBER: [
    'workspace.view',
    'members.view',
    'tasks.create',
    'tasks.complete',
    'campaigns.view',
    'content.create',
    'reports.view',
    'memory.view',
  ],
  VIEWER: [
    'workspace.view',
    'members.view',
    'campaigns.view',
    'reports.view',
    'memory.view',
  ],
};

/**
 * Check if a role possesses a given permission.
 */
export function hasPermission(role: WorkspaceRole, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Compare role hierarchy (e.g. is OWNER > MANAGER)
 */
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 6,
  ADMIN: 5,
  MANAGER: 4,
  EDITOR: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function isRoleAtLeast(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}
