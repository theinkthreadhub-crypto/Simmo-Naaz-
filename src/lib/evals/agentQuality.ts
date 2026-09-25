export interface AgentQualityMetric {
  agentName: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  userApprovalCount: number;
  userCorrectionCount: number;
  lastRunTime: string;
}

export interface SystemIssueRecord {
  id: string;
  issueType: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  module: string;
  occurrenceCount: number;
  status: 'DETECTED' | 'INVESTIGATING' | 'RESOLVED';
  firstSeen: string;
  lastSeen: string;
}

const memQualityMetrics = new Map<string, AgentQualityMetric>();
const memSystemIssues = new Map<string, SystemIssueRecord>();

/**
 * Records an agent run completion metric.
 */
export function recordAgentMetric(
  agentName: string,
  metric: {
    success: boolean;
    durationMs: number;
    requiredApproval?: boolean;
    hadCorrection?: boolean;
  }
): void {
  let record = memQualityMetrics.get(agentName);
  if (!record) {
    record = {
      agentName,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      avgDurationMs: 0,
      userApprovalCount: 0,
      userCorrectionCount: 0,
      lastRunTime: new Date().toISOString()
    };
    memQualityMetrics.set(agentName, record);
  }

  const prevTotal = record.totalRuns;
  record.totalRuns += 1;
  if (metric.success) {
    record.successfulRuns += 1;
  } else {
    record.failedRuns += 1;
  }

  record.avgDurationMs = Math.round(
    (record.avgDurationMs * prevTotal + metric.durationMs) / record.totalRuns
  );

  if (metric.requiredApproval) record.userApprovalCount += 1;
  if (metric.hadCorrection) record.userCorrectionCount += 1;
  record.lastRunTime = new Date().toISOString();
}

/**
 * Clusters recurring technical failures into auditable system issues.
 */
export function reportSystemIssue(
  issueType: string,
  module: string,
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4' = 'SEV3'
): SystemIssueRecord {
  const issueKey = `${module}_${issueType}`;
  let issue = memSystemIssues.get(issueKey);

  if (!issue) {
    issue = {
      id: `iss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      issueType,
      severity,
      module,
      occurrenceCount: 1,
      status: 'DETECTED',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    memSystemIssues.set(issueKey, issue);
  } else {
    issue.occurrenceCount += 1;
    issue.lastSeen = new Date().toISOString();
  }

  return issue;
}

/**
 * Retrieves all monitored agent quality metrics.
 */
export function getAgentQualityMetrics(): AgentQualityMetric[] {
  const list: AgentQualityMetric[] = [];
  memQualityMetrics.forEach(m => list.push(m));
  return list;
}

/**
 * Retrieves detected system issues.
 */
export function getDetectedSystemIssues(): SystemIssueRecord[] {
  const list: SystemIssueRecord[] = [];
  memSystemIssues.forEach(i => list.push(i));
  return list;
}
