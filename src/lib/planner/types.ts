import { ActionRiskLevel, AutonomyMode } from '../safety/riskEngine';

export type PlanStatus =
  | 'DRAFT'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'PAUSED'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

export type PlanStepType =
  | 'RESEARCH'
  | 'ANALYZE'
  | 'CREATE_QUEST'
  | 'CALENDAR_PROPOSAL'
  | 'FINANCE_CHECK'
  | 'EXTERNAL_DRAFT'
  | 'BROWSER_ACTION';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETE'
  | 'FAILED'
  | 'SKIPPED';

export interface PlanStep {
  id: string;
  planId: string;
  stepIndex: number;
  stepType: PlanStepType;
  title: string;
  description: string;
  agent?: string;
  tool?: string;
  dependencies: string[]; // List of step IDs or indexes that must complete first
  status: StepStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  requiresApproval: boolean;
  riskLevel: ActionRiskLevel;
  retryCount: number;
}

export interface SovereignPlan {
  id: string;
  userId: string;
  missionId?: string;
  goal: string;
  status: PlanStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  riskLevel: ActionRiskLevel;
  autonomyMode: AutonomyMode;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
}
