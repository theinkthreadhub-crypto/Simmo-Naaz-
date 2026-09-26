export interface MentraSkillManifest {
  name: string;
  title: string;
  description: string;
  category: 'PERSONAL_OS' | 'BUSINESS' | 'RESEARCH' | 'PRODUCTIVITY' | 'LEARNING';
  requiredTools: string[];
  instructions: string[];
}

const BUILTIN_SKILLS: MentraSkillManifest[] = [
  {
    name: 'deep-research',
    title: 'Deep Research',
    description: 'Research a topic, collect evidence, then synthesize actionable conclusions.',
    category: 'RESEARCH',
    requiredTools: ['runWebResearch', 'searchMemory'],
    instructions: [
      'Search existing memory for prior decisions or constraints.',
      'Run live web research for current evidence.',
      'Separate sourced facts from recommendations.',
      'Return a concise action summary and unresolved questions.'
    ]
  },
  {
    name: 'inbox-calendar-triage',
    title: 'Inbox + Calendar Triage',
    description: 'Review urgent inbox items and today\'s calendar, then identify actions.',
    category: 'PRODUCTIVITY',
    requiredTools: ['searchGmail', 'getCalendarEvents'],
    instructions: [
      'Read only the minimum emails needed to identify urgent work.',
      'Check calendar conflicts and time-sensitive commitments.',
      'Do not send email or create events without approval.',
      'Produce a prioritized action list.'
    ]
  },
  {
    name: 'business-growth-review',
    title: 'Business Growth Review',
    description: 'Combine finance, goals, projects and market research into the next best business actions.',
    category: 'BUSINESS',
    requiredTools: ['getFinanceSummary', 'runWebResearch', 'searchMemory', 'getTodayQuests'],
    instructions: [
      'Review current financial position and active commitments.',
      'Check relevant past business decisions.',
      'Research only the market questions that can change the decision.',
      'Recommend concrete next actions that fit budget and capacity.'
    ]
  },
  {
    name: 'product-launch',
    title: 'Product Launch',
    description: 'Plan a product launch across positioning, research, schedule and execution tasks.',
    category: 'BUSINESS',
    requiredTools: ['runWebResearch', 'getFinanceSummary', 'createQuest', 'getCalendarEvents', 'searchMemory'],
    instructions: [
      'Confirm product objective, target audience and budget from available context.',
      'Research current market and competitor signals.',
      'Create a launch sequence with dated execution tasks.',
      'Require approval before external publishing, email sends or destructive changes.'
    ]
  },
  {
    name: 'weekly-operator-review',
    title: 'Weekly Operator Review',
    description: 'Review goals, quests, finance, learning and decisions to plan the next week.',
    category: 'PERSONAL_OS',
    requiredTools: ['getFinanceSummary', 'getTodayQuests', 'searchMemory', 'getPlayerProgress'],
    instructions: [
      'Summarize measurable progress, not motivation.',
      'Identify unfinished or repeatedly deferred commitments.',
      'Surface decisions that should be revisited.',
      'Propose a small number of next-week priorities.'
    ]
  }
];

export function listMentraSkills(category?: MentraSkillManifest['category']): MentraSkillManifest[] {
  return category ? BUILTIN_SKILLS.filter(skill => skill.category === category) : [...BUILTIN_SKILLS];
}

export function getMentraSkill(name: string): MentraSkillManifest | null {
  const normalized = name.trim().toLowerCase();
  return BUILTIN_SKILLS.find(skill => skill.name === normalized) || null;
}

export function getSkillCatalogPrompt(): string {
  return BUILTIN_SKILLS
    .map(skill => `- ${skill.name}: ${skill.description}`)
    .join('\n');
}
