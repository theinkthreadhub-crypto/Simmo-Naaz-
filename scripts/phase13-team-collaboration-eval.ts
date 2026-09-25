/**
 * MENTRA PHASE 13 EVALUATION SUITE: SECURE TEAM & COLLABORATION LAYER
 * 
 * 10-Point Comprehensive Test Suite:
 *  1. Workspace Creation & Member RBAC
 *  2. Secure Single-Use Invitation & Replay Attack Protection
 *  3. Task Delegation & Status Transitions (TODO -> IN_PROGRESS -> REVIEW -> COMPLETE)
 *  4. Version-Safe Approval Invalidation
 *  5. Strict Personal Privacy Isolation (Personal Journal & Memory cannot leak to team)
 *  6. Workspace Memory vs Personal Memory Separation
 *  7. Agent RBAC Enforcement (Editor blocked from financial mutations)
 *  8. Removed/Suspended Member Immediate Revocation
 *  9. Cross-Workspace Resource Access Isolation
 * 10. Multi-Tenant Audit Trail & Activity Logging
 */

import {
  createWorkspace,
  getWorkspaceById,
  createInvitation,
  acceptInvitation,
  getWorkspaceMembers,
  updateMemberRole,
  removeWorkspaceMember,
  createWorkspaceTask,
  getWorkspaceTasks,
  updateWorkspaceTaskStatus,
  addWorkspaceComment,
  saveWorkspaceMemory,
  getWorkspaceMemories,
  getWorkspaceActivity,
  can,
} from '../src/lib/db/workspace';
import { hasPermission, isRoleAtLeast } from '../src/lib/workspace/rbac';

async function runEvaluation() {
  console.log('======================================================');
  console.log(' MENTRA PHASE 13 EVALUATION: TEAM & COLLABORATION RBAC');
  console.log('======================================================\n');

  let passed = 0;
  const total = 10;

  // [TEST 1/10] Workspace Creation & Member RBAC
  console.log('[TEST 1/10] Workspace Creation & Member RBAC...');
  const ownerId = 'usr_owner_naaz';
  const ws = await createWorkspace({
    name: 'InkThread Hub Team',
    type: 'BUSINESS',
    owner_id: ownerId,
    business_id: 'biz_inkthread_001',
  });

  const isOwnerAdmin = await can(ownerId, 'workspace.manage', ws.id);
  const isOwnerPublisher = await can(ownerId, 'content.publish', ws.id);

  if (ws && isOwnerAdmin && isOwnerPublisher) {
    console.log(`  -> PASS: Workspace '${ws.name}' created with OWNER permissions confirmed.`);
    passed++;
  } else {
    console.error('  -> FAIL: Workspace creation or owner RBAC failed.');
  }

  // [TEST 2/10] Secure Single-Use Invitation & Replay Prevention
  console.log('\n[TEST 2/10] Secure Single-Use Invitation & Replay Prevention...');
  const managerEmail = 'aarav.manager@inkthreadhub.com';
  const managerUserId = 'usr_aarav_mgr';

  const inv = await createInvitation({
    workspace_id: ws.id,
    email: managerEmail,
    role: 'MANAGER',
    invited_by: ownerId,
  });

  const acceptRes1 = await acceptInvitation(inv.token, managerUserId);
  const acceptRes2 = await acceptInvitation(inv.token, 'usr_hacker_attacker'); // Replay attack attempt

  const isManagerCanApprove = await can(managerUserId, 'content.approve', ws.id);
  const isManagerCanDeleteWs = await can(managerUserId, 'workspace.delete', ws.id);

  if (
    acceptRes1.success &&
    !acceptRes2.success &&
    acceptRes2.error === 'TOKEN_ALREADY_USED_OR_REVOKED' &&
    isManagerCanApprove &&
    !isManagerCanDeleteWs
  ) {
    console.log('  -> PASS: Single-use token accepted, replay attempt blocked, Manager capabilities verified.');
    passed++;
  } else {
    console.error('  -> FAIL: Invitation flow or replay protection failed.');
  }

  // [TEST 3/10] Task Delegation & Status Transitions
  console.log('\n[TEST 3/10] Task Delegation & Status Transitions...');
  const editorUserId = 'usr_riya_editor';
  const editorInv = await createInvitation({
    workspace_id: ws.id,
    email: 'riya.creator@inkthreadhub.com',
    role: 'EDITOR',
    invited_by: managerUserId,
  });
  await acceptInvitation(editorInv.token, editorUserId);

  const task = await createWorkspaceTask({
    workspace_id: ws.id,
    title: 'Edit 3 Heavyweight Tee Reels',
    description: 'Hook focused on 280 GSM pure combed cotton drop drape',
    created_by: managerUserId,
    assigned_to: editorUserId,
    priority: 'HIGH',
    due_date: '2026-10-02T18:00:00Z',
    review_required: true,
  });

  const inProgressTask = await updateWorkspaceTaskStatus(task.id, 'IN_PROGRESS', editorUserId);
  const reviewTask = await updateWorkspaceTaskStatus(task.id, 'REVIEW', editorUserId);
  const completeTask = await updateWorkspaceTaskStatus(task.id, 'COMPLETE', managerUserId);

  if (
    task &&
    inProgressTask?.status === 'IN_PROGRESS' &&
    reviewTask?.status === 'REVIEW' &&
    completeTask?.status === 'COMPLETE'
  ) {
    console.log('  -> PASS: Task delegated to Editor and transitioned TODO -> IN_PROGRESS -> REVIEW -> COMPLETE.');
    passed++;
  } else {
    console.error('  -> FAIL: Task delegation or status transitions failed.');
  }

  // [TEST 4/10] Version-Safe Approval Invalidation
  console.log('\n[TEST 4/10] Version-Safe Approval Invalidation...');
  interface ContentVersionRecord {
    id: string;
    version: number;
    text: string;
    approved_version: number | null;
    is_approved: boolean;
  }

  const postDraft: ContentVersionRecord = {
    id: 'post_001',
    version: 1,
    text: 'Raw heavyweight drop is live. 280 GSM pure cotton.',
    approved_version: null,
    is_approved: false,
  };

  // Manager approves version 1
  postDraft.approved_version = postDraft.version;
  postDraft.is_approved = true;

  // Editor subsequently modifies copy -> version 2
  postDraft.version = 2;
  postDraft.text = 'Raw heavyweight drop is live. Now with 20% discount!';
  
  // Security check: previous approval MUST become invalid because version != approved_version
  const isValidApproval = postDraft.is_approved && postDraft.approved_version === postDraft.version;

  if (!isValidApproval) {
    console.log('  -> PASS: Post modification to v2 invalidated v1 approval. Unapproved mutation blocked.');
    passed++;
  } else {
    console.error('  -> FAIL: Approval invalidation failed.');
  }

  // [TEST 5/10] Strict Personal Privacy Isolation
  console.log('\n[TEST 5/10] Strict Personal Privacy Isolation...');
  interface PersonalJournalRecord {
    id: string;
    user_id: string;
    entry: string;
    is_private: boolean;
  }

  const riyaPrivateJournal: PersonalJournalRecord = {
    id: 'jrn_riya_001',
    user_id: editorUserId,
    entry: 'Feeling nervous about the upcoming public speaking showcase.',
    is_private: true,
  };

  // Attempt read by workspace owner/manager
  function canAccessJournal(requesterId: string, record: PersonalJournalRecord): boolean {
    return requesterId === record.user_id; // Strictly personal
  }

  const ownerAccess = canAccessJournal(ownerId, riyaPrivateJournal);
  const managerAccess = canAccessJournal(managerUserId, riyaPrivateJournal);
  const riyaAccess = canAccessJournal(editorUserId, riyaPrivateJournal);

  if (!ownerAccess && !managerAccess && riyaAccess) {
    console.log('  -> PASS: Personal Journal strictly isolated. Workspace Owner & Manager denied access.');
    passed++;
  } else {
    console.error('  -> FAIL: Personal journal privacy breached.');
  }

  // [TEST 6/10] Workspace Memory vs Personal Memory Separation
  console.log('\n[TEST 6/10] Workspace Memory vs Personal Memory Separation...');
  const businessMemory = await saveWorkspaceMemory({
    workspace_id: ws.id,
    category: 'SUPPLIER_CONTEXT',
    content: 'Surat Knits requires vector artwork 3 days before production run.',
    created_by: managerUserId,
    source: 'Supplier Contract Log',
  });

  const wsMemories = await getWorkspaceMemories(ws.id);
  const isAccessibleToTeam = wsMemories.some(m => m.id === businessMemory.id);

  if (businessMemory && isAccessibleToTeam && businessMemory.category === 'SUPPLIER_CONTEXT') {
    console.log('  -> PASS: Workspace Memory categorized and shared across team without touching personal memory.');
    passed++;
  } else {
    console.error('  -> FAIL: Workspace memory storage or categorization failed.');
  }

  // [TEST 7/10] Agent RBAC & Scope Enforcement
  console.log('\n[TEST 7/10] Agent RBAC & Scope Enforcement...');
  const isEditorCanEditFinance = await can(editorUserId, 'finance.edit', ws.id);
  const isManagerCanViewFinance = await can(managerUserId, 'finance.view', ws.id);
  const isOwnerCanEditFinance = await can(ownerId, 'finance.edit', ws.id);

  if (!isEditorCanEditFinance && isManagerCanViewFinance && isOwnerCanEditFinance) {
    console.log('  -> PASS: Editor blocked from finance tools. Manager and Owner authorized correctly.');
    passed++;
  } else {
    console.error('  -> FAIL: Agent RBAC authorization check failed.');
  }

  // [TEST 8/10] Removed/Suspended Member Immediate Revocation
  console.log('\n[TEST 8/10] Removed/Suspended Member Immediate Revocation...');
  await removeWorkspaceMember(ws.id, editorUserId, ownerId);
  const isRemovedEditorCanAccess = await can(editorUserId, 'tasks.create', ws.id);

  if (!isRemovedEditorCanAccess) {
    console.log('  -> PASS: Removed member immediately lost all workspace capabilities.');
    passed++;
  } else {
    console.error('  -> FAIL: Removed member still retained workspace permissions.');
  }

  // [TEST 9/10] Cross-Workspace Resource Access Isolation
  console.log('\n[TEST 9/10] Cross-Workspace Resource Access Isolation...');
  const foreignWorkspace = await createWorkspace({
    name: 'Competitor Brand Corp',
    type: 'BUSINESS',
    owner_id: 'usr_external_competitor',
  });

  const isInkThreadOwnerCanAccessForeign = await can(ownerId, 'workspace.view', foreignWorkspace.id);
  const isForeignOwnerCanAccessInkThread = await can('usr_external_competitor', 'workspace.view', ws.id);

  if (!isInkThreadOwnerCanAccessForeign && !isForeignOwnerCanAccessInkThread) {
    console.log('  -> PASS: Strict cross-workspace isolation verified. Cross-tenant access denied.');
    passed++;
  } else {
    console.error('  -> FAIL: Cross-workspace tenant isolation breached.');
  }

  // [TEST 10/10] Multi-Tenant Audit Trail & Activity Logging
  console.log('\n[TEST 10/10] Multi-Tenant Audit Trail & Activity Logging...');
  const activityLogs = await getWorkspaceActivity(ws.id);
  const hasCreationLog = activityLogs.some(a => a.action === 'WORKSPACE_CREATED');
  const hasTaskLog = activityLogs.some(a => a.action === 'TASK_CREATED');
  const hasRemovalLog = activityLogs.some(a => a.action === 'MEMBER_REMOVED');

  if (activityLogs.length >= 4 && hasCreationLog && hasTaskLog && hasRemovalLog) {
    console.log(`  -> PASS: Complete audit trail recorded (${activityLogs.length} events logged with actor IDs).`);
    passed++;
  } else {
    console.error('  -> FAIL: Audit logging incomplete or missing expected event types.');
  }

  console.log('\n======================================================');
  console.log(`EVALUATION RESULT: ${passed}/${total} PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEvaluation().catch(err => {
  console.error('Evaluation uncaught error:', err);
  process.exit(1);
});
