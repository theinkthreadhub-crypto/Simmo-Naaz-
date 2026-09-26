import type { ModelPurpose } from '@/lib/ai/modelRouter';

/**
 * MENTRA Lead Agent — sub-agent profiles.
 *
 * Design inspired by ByteDance DeerFlow (MIT License):
 * a lead agent plans, then scoped sub-agents execute each step
 * with only the tools they need.
 */

export const SUB_AGENT_IDS = [
  'research',
  'business',
  'finance',
  'memory',
  'calendar',
  'gmail',
  'drive',
  'learning'
] as const;

export type SubAgentId = (typeof SUB_AGENT_IDS)[number];

export interface SubAgentProfile {
  id: SubAgentId;
  title: string;
  description: string;
  purpose: ModelPurpose;
  tools: string[];
  instructions: string;
}

/**
 * Tools a sub-agent may never receive. Prevents recursive
 * lead-agent spawning and fake dispatch cards.
 */
export const FORBIDDEN_SUB_AGENT_TOOLS = new Set<string>([
  'runMultiAgentTask',
  'routeToAgent',
  'createCustomMentraSkill',
  'disableCustomMentraSkill'
]);

export const SUB_AGENT_PROFILES: Record<SubAgentId, SubAgentProfile> = {
  research: {
    id: 'research',
    title: 'Research Agent',
    description: 'Live web research, trends, competitors, market data, reading public URLs.',
    purpose: 'RESEARCH',
    tools: ['runWebResearch', 'browserRead', 'searchMemory'],
    instructions:
      'Find current, credible information. Prefer runWebResearch; use browserRead only for a specific public URL. Report key findings with source names and dates. Flag weak or conflicting evidence.'
  },
  business: {
    id: 'business',
    title: 'Business Agent',
    description: 'Business strategy, quests, goals, reusable MENTRA skills/workflows, operator progress.',
    purpose: 'AGENT',
    tools: [
      'getPlayerProgress',
      'getTodayQuests',
      'createQuest',
      'createGoal',
      'listMentraSkills',
      'activateMentraSkill',
      'searchMemory'
    ],
    instructions:
      'Turn information into practical business actions. Check existing quests/goals before creating new ones. Only create quests or goals when the instruction explicitly asks for it.'
  },
  finance: {
    id: 'finance',
    title: 'Finance Agent',
    description: 'Income, expenses, burn rate, budgets, recording transactions.',
    purpose: 'AGENT',
    tools: ['getFinanceSummary', 'addFinanceTransaction'],
    instructions:
      'Use real ledger data only. Show amounts in INR. Only record a transaction when the instruction explicitly gives amount and type.'
  },
  memory: {
    id: 'memory',
    title: 'Memory Agent',
    description: 'Second Brain: recall past decisions, ideas, people, preferences; save journal reflections.',
    purpose: 'MEMORY',
    tools: ['searchMemory', 'saveJournal'],
    instructions:
      'Search memory with 1-3 focused queries. Quote the relevant memory titles. Only save a journal entry when explicitly asked.'
  },
  calendar: {
    id: 'calendar',
    title: 'Calendar Agent',
    description: 'Google Calendar schedule, availability, conflicts, creating focus blocks/events.',
    purpose: 'AGENT',
    tools: ['getConnections', 'getCalendarEvents', 'createCalendarEvent'],
    instructions:
      'Check the schedule first. Times are IST unless stated. Only create events when explicitly asked, and report conflicts instead of forcing a slot.'
  },
  gmail: {
    id: 'gmail',
    title: 'Gmail Agent',
    description: 'Search/read Gmail, find contacts, draft replies, send email (always needs approval).',
    purpose: 'AGENT',
    tools: ['getConnections', 'searchGmail', 'readEmail', 'searchContacts', 'draftEmail', 'sendEmail'],
    instructions:
      'Read before you write. Prefer drafting over sending. Sending email always goes through the approval gate — never claim an email was sent unless a tool result confirms it.'
  },
  drive: {
    id: 'drive',
    title: 'Drive Agent',
    description: 'Google Drive files, Docs text, Google Sheets read/append.',
    purpose: 'AGENT',
    tools: ['searchDrive', 'readDriveFile', 'readSheet', 'appendToSheet'],
    instructions:
      'Locate the right file first, then read only what is needed. Appending to a sheet requires approval.'
  },
  learning: {
    id: 'learning',
    title: 'Learning Agent',
    description: 'Skill tracks, practice exercises, learning roadmaps.',
    purpose: 'AGENT',
    tools: ['getPlayerProgress', 'getNextLearningActivity', 'createSkill'],
    instructions:
      'Give the next concrete practice step. Only start a new skill track when explicitly asked.'
  }
};

/** Maps legacy agentChain ids (ag_research, research_agent, ...) to profiles. */
export function mapLegacyAgentId(raw: string): SubAgentId | null {
  const clean = raw.toLowerCase().replace(/^ag_/, '').replace(/_agent$/, '').trim();
  return (SUB_AGENT_IDS as readonly string[]).includes(clean) ? (clean as SubAgentId) : null;
}

export function describeSubAgentsForPlanner(): string {
  return SUB_AGENT_IDS.map(id => {
    const profile = SUB_AGENT_PROFILES[id];
    return `- ${id}: ${profile.description}`;
  }).join('\n');
}
