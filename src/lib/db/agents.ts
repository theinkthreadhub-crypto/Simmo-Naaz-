import { supabase } from '@/lib/supabase/client';
import { MentraAgent, AgentRun, AgentApproval } from '@/types/mentra';

export const systemAgentDefinitions: MentraAgent[] = [
  {
    id: 'ag_core',
    name: 'MENTRA Core',
    role: 'Central Intelligence & Operating System Orchestrator',
    description: 'Autonomous central nervous system routing tasks, scheduling ultradian focus, and managing system permissions.',
    status: 'READY',
    currentTask: 'All agent nodes synchronized and telemetry active',
    lastRun: 'Just now',
    permissionLevel: 'EXECUTE',
    requiresApproval: false,
    iconName: 'Cpu',
    stats: { tasksCompleted: 512, accuracyRate: 99.9 }
  },
  {
    id: 'ag_research',
    name: 'Research Agent',
    role: 'Market & Deep Intelligence Scanner',
    description: 'Continuously scouts market opportunities, competitor pricing, and emerging technical breakthroughs.',
    status: 'READY',
    currentTask: 'Standing by for deep intelligence research queries',
    lastRun: '10 mins ago',
    permissionLevel: 'ANALYZE',
    requiresApproval: false,
    iconName: 'Compass',
    stats: { tasksCompleted: 142, accuracyRate: 98.0 }
  },
  {
    id: 'ag_gmail',
    name: 'Gmail Agent',
    role: 'Executive Inbox & Communication Gatekeeper',
    description: 'Screens urgent emails, drafts high-leverage replies, flags critical invoices and vendor alerts.',
    status: 'READY',
    currentTask: 'Inbox monitoring active — zero unread blockers',
    lastRun: '15 mins ago',
    permissionLevel: 'RECOMMEND',
    requiresApproval: true,
    iconName: 'Mail',
    stats: { tasksCompleted: 89, accuracyRate: 96.5 }
  },
  {
    id: 'ag_calendar',
    name: 'Calendar Agent',
    role: 'Time Horizon & Deep Work Protector',
    description: 'Enforces ultradian work blocks, eliminates schedule conflicts, and buffers mental recovery time.',
    status: 'READY',
    currentTask: 'Protected 90-min Deep Focus Block scheduled for 15:00',
    lastRun: '1 hour ago',
    permissionLevel: 'PREPARE',
    requiresApproval: true,
    iconName: 'Calendar',
    stats: { tasksCompleted: 64, accuracyRate: 99.0 }
  },
  {
    id: 'ag_drive',
    name: 'Drive & Assets Agent',
    role: 'Digital Asset & Document Indexer',
    description: 'Synchronizes design mockups, financial sheets, and legal contracts into structured neural vector index.',
    status: 'IDLE',
    currentTask: 'Standing by for new vector ingestion batch',
    lastRun: '3 hours ago',
    permissionLevel: 'READ',
    requiresApproval: false,
    iconName: 'HardDrive',
    stats: { tasksCompleted: 120, accuracyRate: 100 }
  },
  {
    id: 'ag_finance',
    name: 'Finance Agent',
    role: 'Unit Economics & Runway Sentinel',
    description: 'Tracks cash burn velocity, flags ROAS degradation, forecasts taxes, and audits unexpected fees.',
    status: 'READY',
    currentTask: 'Real-time transaction anomaly scanner active',
    lastRun: 'Just now',
    permissionLevel: 'ANALYZE',
    requiresApproval: false,
    iconName: 'DollarSign',
    stats: { tasksCompleted: 215, accuracyRate: 99.4 }
  },
  {
    id: 'ag_learning',
    name: 'Learning Agent',
    role: 'Skill Mastery & Knowledge Extractor',
    description: 'Curates progressive roadmaps, generates daily practice quests, and quizzes conceptual understanding.',
    status: 'IDLE',
    currentTask: 'Curating practice mission: AI Agent Architecture',
    lastRun: '4 hours ago',
    permissionLevel: 'RECOMMEND',
    requiresApproval: false,
    iconName: 'GraduationCap',
    stats: { tasksCompleted: 77, accuracyRate: 95.0 }
  },
  {
    id: 'ag_business',
    name: 'Business Agent',
    role: 'E-commerce & Operations Multiplier',
    description: 'Oversees product pipeline, conversion funnels, inventory alerts, and prepares executive weekly summaries.',
    status: 'WAITING_APPROVAL',
    currentTask: 'Prepared weekly executive brief — awaiting operator sign-off',
    lastRun: '10 mins ago',
    permissionLevel: 'PREPARE',
    requiresApproval: true,
    iconName: 'Briefcase',
    stats: { tasksCompleted: 103, accuracyRate: 97.2 }
  },
  {
    id: 'ag_memory',
    name: 'Memory Agent',
    role: 'Neural Long-Term Memory Synthesizer',
    description: 'Extracts strategic decisions, principles, and key facts from daily logs and commands.',
    status: 'READY',
    currentTask: 'Synthesizing recent journal decisions into memory vault',
    lastRun: '20 mins ago',
    permissionLevel: 'ANALYZE',
    requiresApproval: false,
    iconName: 'Cpu',
    stats: { tasksCompleted: 310, accuracyRate: 99.8 }
  }
];

export async function getUserAgentApprovals(userId: string): Promise<AgentApproval[]> {
  const { data, error } = await supabase
    .from('agent_approvals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'PENDING');

  if (error || !data) return [];
  return data as AgentApproval[];
}

export async function approveAgentAction(userId: string, approvalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('agent_approvals')
    .update({ status: 'APPROVED' })
    .eq('id', approvalId)
    .eq('user_id', userId);

  return !error;
}
