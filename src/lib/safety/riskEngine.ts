export type ActionRiskLevel =
  | 'READ_ONLY'
  | 'LOW_RISK_INTERNAL'
  | 'LOW_RISK_EXTERNAL'
  | 'SENSITIVE'
  | 'DESTRUCTIVE'
  | 'FINANCIAL'
  | 'SECURITY';

export type AutonomyMode = 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL';
export type DeclaredToolPermission = 'READ' | 'WRITE_LOW' | 'APPROVAL_REQUIRED';

export interface ActionPermissionResult {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: ActionRiskLevel;
  reason: string;
}

export function getConfiguredAutonomyMode(): AutonomyMode {
  const configured = (process.env.AUTONOMY_MODE || 'ASSISTED').toUpperCase();
  if (configured === 'MANUAL' || configured === 'TRUSTED_INTERNAL') {
    return configured;
  }
  return 'ASSISTED';
}

/**
 * Deterministically classifies the risk level of any tool, agent, or browser action.
 */
export function classifyActionRisk(
  toolOrActionName: string,
  payload?: Record<string, unknown>
): ActionRiskLevel {
  const name = toolOrActionName.toLowerCase();

  if (
    name.includes('token') ||
    name.includes('password') ||
    name.includes('auth') ||
    name.includes('credential')
  ) {
    return 'SECURITY';
  }

  if (
    name.includes('delete') ||
    name.includes('remove') ||
    name.includes('destroy') ||
    name.includes('purge')
  ) {
    return 'DESTRUCTIVE';
  }

  if (
    name.includes('payment') ||
    name.includes('transfer') ||
    name.includes('checkout') ||
    name.includes('purchase')
  ) {
    return 'FINANCIAL';
  }

  // External mutations always stop for explicit operator approval.
  if (
    name === 'sendemail' ||
    name === 'send_email' ||
    name === 'createcalendarevent' ||
    name === 'appendtosheet' ||
    name.includes('browser_submit') ||
    name.includes('browser_click') ||
    name.includes('browser_type') ||
    name.includes('submit') ||
    name.includes('publish')
  ) {
    return 'SENSITIVE';
  }

  if (
    name.includes('research') ||
    name.includes('search') ||
    name.includes('readpage') ||
    name.includes('navigate')
  ) {
    return 'LOW_RISK_EXTERNAL';
  }

  if (
    name.includes('createquest') ||
    name.includes('completequest') ||
    name.includes('creategoal') ||
    name.includes('createskill') ||
    name.includes('journal') ||
    name.includes('addexpense') ||
    name.includes('addfinancetransaction') ||
    name.includes('memory') ||
    name.includes('routetoagent') ||
    name.includes('schedulemonitor')
  ) {
    return 'LOW_RISK_INTERNAL';
  }

  return 'READ_ONLY';
}

export function evaluateActionPermission(
  autonomyMode: AutonomyMode,
  toolOrActionName: string,
  payload?: Record<string, unknown>
): ActionPermissionResult {
  const riskLevel = classifyActionRisk(toolOrActionName, payload);

  if (
    riskLevel === 'SECURITY' ||
    riskLevel === 'FINANCIAL' ||
    riskLevel === 'DESTRUCTIVE'
  ) {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: `Action carries ${riskLevel} risk and mandates human operator authorization.`
    };
  }

  if (riskLevel === 'SENSITIVE') {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: 'External mutation requires operator checkpoint before delivery.'
    };
  }

  if (autonomyMode === 'MANUAL') {
    if (riskLevel === 'READ_ONLY') {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel,
        reason: 'Read-only query allowed in Manual mode.'
      };
    }
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: 'Manual mode requires approval for all state changes.'
    };
  }

  if (autonomyMode === 'ASSISTED') {
    if (riskLevel === 'READ_ONLY' || riskLevel === 'LOW_RISK_EXTERNAL') {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel,
        reason: 'Autonomous execution authorized for assisted research.'
      };
    }
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel,
      reason: 'Assisted mode requires approval before internal state mutation.'
    };
  }

  if (autonomyMode === 'TRUSTED_INTERNAL') {
    if (
      riskLevel === 'READ_ONLY' ||
      riskLevel === 'LOW_RISK_EXTERNAL' ||
      riskLevel === 'LOW_RISK_INTERNAL'
    ) {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel,
        reason: 'Autonomous internal operation granted under Trusted Internal policy.'
      };
    }
  }

  return {
    allowed: true,
    requiresApproval: true,
    riskLevel,
    reason: 'Operator approval required by sovereign boundary policy.'
  };
}

/**
 * Combines a tool's declared permission with deterministic risk classification.
 * Declared permissions prevent a mutating tool from accidentally falling through
 * to READ_ONLY merely because its name was not recognized.
 */
export function evaluateToolPermission(
  declaredPermission: DeclaredToolPermission,
  autonomyMode: AutonomyMode,
  toolOrActionName: string,
  payload?: Record<string, unknown>
): ActionPermissionResult {
  const classified = evaluateActionPermission(
    autonomyMode,
    toolOrActionName,
    payload
  );

  // A stronger risk classification always wins.
  if (
    classified.riskLevel === 'SENSITIVE' ||
    classified.riskLevel === 'DESTRUCTIVE' ||
    classified.riskLevel === 'FINANCIAL' ||
    classified.riskLevel === 'SECURITY'
  ) {
    return classified;
  }

  if (declaredPermission === 'APPROVAL_REQUIRED') {
    return {
      allowed: true,
      requiresApproval: true,
      riskLevel:
        classified.riskLevel === 'READ_ONLY'
          ? 'SENSITIVE'
          : classified.riskLevel,
      reason: 'Tool contract requires explicit operator approval.'
    };
  }

  if (declaredPermission === 'WRITE_LOW') {
    if (autonomyMode === 'TRUSTED_INTERNAL') {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel:
          classified.riskLevel === 'READ_ONLY'
            ? 'LOW_RISK_INTERNAL'
            : classified.riskLevel,
        reason: 'Low-risk internal write allowed in Trusted Internal mode.'
      };
    }

    return {
      allowed: true,
      requiresApproval: true,
      riskLevel:
        classified.riskLevel === 'READ_ONLY'
          ? 'LOW_RISK_INTERNAL'
          : classified.riskLevel,
      reason:
        autonomyMode === 'MANUAL'
          ? 'Manual mode requires approval for state changes.'
          : 'Assisted mode requires approval for low-risk state changes.'
    };
  }

  return classified;
}
