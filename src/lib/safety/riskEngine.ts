export type ActionRiskLevel =
  | 'READ_ONLY'
  | 'LOW_RISK_INTERNAL'
  | 'LOW_RISK_EXTERNAL'
  | 'SENSITIVE'
  | 'DESTRUCTIVE'
  | 'FINANCIAL'
  | 'SECURITY';

export type AutonomyMode = 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL';

export interface ActionPermissionResult {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: ActionRiskLevel;
  reason: string;
}

/**
 * Deterministically classifies the risk level of any tool, agent, or browser action
 */
export function classifyActionRisk(toolOrActionName: string, payload?: Record<string, unknown>): ActionRiskLevel {
  const name = toolOrActionName.toLowerCase();

  // 1. Security Risk
  if (name.includes('token') || name.includes('password') || name.includes('auth') || name.includes('credential')) {
    return 'SECURITY';
  }

  // 2. Destructive Risk
  if (name.includes('delete') || name.includes('remove') || name.includes('destroy') || name.includes('purge')) {
    return 'DESTRUCTIVE';
  }

  // 3. Financial Execution Risk
  if (name.includes('payment') || name.includes('transfer') || name.includes('checkout') || name.includes('purchase')) {
    return 'FINANCIAL';
  }

  // 4. External Mutating Actions (Email Send, Sheet Edit, Form Submission, Browser Click/Submit)
  if (name === 'sendemail' || name === 'send_email' || name.includes('submit') || name.includes('publish') || name.includes('click')) {
    return 'SENSITIVE';
  }

  // 5. Low Risk External Actions (Web Search, Live Research, Reading Remote Page)
  if (name.includes('research') || name.includes('search') || name.includes('readpage') || name.includes('navigate')) {
    return 'LOW_RISK_EXTERNAL';
  }

  // 6. Low Risk Internal Actions (Quest Creation, Journal Entry, Internal Memory Tag)
  if (name.includes('createquest') || name.includes('create_quest') || name.includes('journal') || name.includes('addexpense') || name.includes('memory')) {
    return 'LOW_RISK_INTERNAL';
  }

  // 7. Default Read-Only
  return 'READ_ONLY';
}

/**
 * Evaluates whether an action can execute autonomously or requires human approval
 */
export function evaluateActionPermission(
  autonomyMode: AutonomyMode,
  toolOrActionName: string,
  payload?: Record<string, unknown>
): ActionPermissionResult {
  const riskLevel = classifyActionRisk(toolOrActionName, payload);

  // Critical safety gates: DESTRUCTIVE, FINANCIAL, and SECURITY ALWAYS require explicit approval regardless of mode
  if (riskLevel === 'SECURITY' || riskLevel === 'FINANCIAL' || riskLevel === 'DESTRUCTIVE') {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: `Action carries ${riskLevel} risk and mandates human operator authorization.`
    };
  }

  // Sensitive actions (e.g. sending emails) always require approval
  if (riskLevel === 'SENSITIVE') {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: 'External mutation requires operator checkpoint before delivery.'
    };
  }

  // Mode: MANUAL -> Everything requires approval except READ_ONLY
  if (autonomyMode === 'MANUAL') {
    if (riskLevel === 'READ_ONLY') {
      return { allowed: true, requiresApproval: false, riskLevel, reason: 'Read-only query allowed in Manual mode.' };
    }
    return { allowed: true, requiresApproval: true, riskLevel, reason: 'Manual mode requires approval for all state changes.' };
  }

  // Mode: ASSISTED -> Read-only and external research can run autonomously; writes require approval
  if (autonomyMode === 'ASSISTED') {
    if (riskLevel === 'READ_ONLY' || riskLevel === 'LOW_RISK_EXTERNAL') {
      return { allowed: true, requiresApproval: false, riskLevel, reason: 'Autonomous execution authorized for assisted research.' };
    }
    return { allowed: true, requiresApproval: true, riskLevel, reason: 'Assisted mode requires approval before internal state mutation.' };
  }

  // Mode: TRUSTED_INTERNAL -> Read-only, external research, and low-risk internal writes can execute autonomously
  if (autonomyMode === 'TRUSTED_INTERNAL') {
    if (riskLevel === 'READ_ONLY' || riskLevel === 'LOW_RISK_EXTERNAL' || riskLevel === 'LOW_RISK_INTERNAL') {
      return { allowed: true, requiresApproval: false, riskLevel, reason: 'Autonomous internal operation granted under Trusted Internal policy.' };
    }
  }

  return {
    allowed: true,
    requiresApproval: true,
    riskLevel,
    reason: 'Operator approval required by sovereign boundary policy.'
  };
}
