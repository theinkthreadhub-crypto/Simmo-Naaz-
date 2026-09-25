import { create } from 'zustand';
import {
  PlayerProfile,
  PlayerStats,
  StatKey,
  Quest,
  Goal,
  SkillNode,
  FinanceSummary,
  FinanceTransaction,
  JournalEntry,
  MemoryItem,
  MentraAgent,
  IntegrationConnection,
  MentraNotification
} from '@/types/mentra';
import { getUserQuests } from '@/lib/db/quests';
import { getUserGoals } from '@/lib/db/goals';
import { getUserSkills } from '@/lib/db/skills';
import { getUserFinance } from '@/lib/db/finance';
import { getUserJournal } from '@/lib/db/journal';
import { getUserMemories } from '@/lib/db/memories';
import { getUserIntegrations } from '@/lib/db/integrations';
import { getProfile, getPlayerProgress, getPlayerStats } from '@/lib/db/profiles';

interface MentraState {
  player: PlayerProfile;
  quests: Quest[];
  goals: Goal[];
  skills: SkillNode[];
  finance: FinanceSummary;
  journalEntries: JournalEntry[];
  memories: MemoryItem[];
  agents: MentraAgent[];
  integrations: IntegrationConnection[];
  notifications: MentraNotification[];
  systemBooted: boolean;
  activeCommandResponse: string | null;
  
  // Actions
  bootSystem: () => void;
  completeQuest: (questId: string) => void;
  addXp: (amount: number, statCategory?: StatKey) => void;
  addTransaction: (tx: Omit<FinanceTransaction, 'id' | 'date'>) => void;
  addMemory: (item: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'extractedMemoryIds'>) => void;
  updateAgentStatus: (agentId: string, status: MentraAgent['status'], currentTask?: string) => void;
  approveAgentTask: (agentId: string) => void;
  toggleIntegration: (id: string) => void;
  executeCommand: (query: string) => { success: boolean; message: string };
  clearCommandResponse: () => void;
  syncUserDatabase: (userId: string) => Promise<void>;
  resetToNewUser: (name: string, userId: string) => void;
}

const initialPlayer: PlayerProfile = {
  id: 'usr_001',
  name: 'Operator Naaz',
  codename: 'MENTRA-SOV-01',
  title: 'Vanguard Architect',
  level: 7,
  currentXp: 680,
  nextLevelXp: 1000,
  streakDays: 14,
  totalQuestsCompleted: 42,
  rank: 'TACTICIAN',
  stats: {
    focus: 78,
    discipline: 82,
    knowledge: 85,
    business: 74,
    finance: 69,
    communication: 72,
    fitness: 65,
  }
};

const initialQuests: Quest[] = [
  {
    id: 'q_01',
    title: 'Deploy Meta Ads Campaign Scale Test',
    description: 'Structure and launch A/B test for autumn apparel drop targeting top 3 converting lookalikes.',
    category: 'BUSINESS',
    type: 'DAILY',
    difficulty: 'MEDIUM',
    rewardXp: 80,
    rewardCoins: 50,
    skillXpCategory: 'business',
    skillXpAmount: 30,
    status: 'ACTIVE',
    progressPercent: 65,
    requiredAction: 'Verify ad copy and ROAS threshold'
  },
  {
    id: 'q_02',
    title: 'Review Inventory Unit Economics',
    description: 'Calculate net landed cost per unit and reconcile supplier payments for next batch.',
    category: 'FINANCE',
    type: 'DAILY',
    difficulty: 'HARD',
    rewardXp: 120,
    rewardCoins: 75,
    skillXpCategory: 'finance',
    skillXpAmount: 45,
    status: 'ACTIVE',
    progressPercent: 30,
    requiredAction: 'Reconcile GST invoice & margin breakdown'
  },
  {
    id: 'q_03',
    title: 'Deep Work: Python AI Automation Pipeline',
    description: 'Complete lesson 4 on multi-agent task dispatching and async orchestration.',
    category: 'LEARNING',
    type: 'DAILY',
    difficulty: 'MEDIUM',
    rewardXp: 90,
    rewardCoins: 40,
    skillXpCategory: 'knowledge',
    skillXpAmount: 40,
    status: 'ACTIVE',
    progressPercent: 80,
    requiredAction: 'Run pipeline unit test'
  },
  {
    id: 'q_04',
    title: 'High-Intensity Calisthenics Protocol',
    description: '45-minute strength and endurance session to sustain neural stamina.',
    category: 'FITNESS',
    type: 'DAILY',
    difficulty: 'EASY',
    rewardXp: 50,
    rewardCoins: 25,
    skillXpCategory: 'fitness',
    skillXpAmount: 25,
    status: 'ACTIVE',
    progressPercent: 0,
    requiredAction: 'Log workout completion'
  },
  {
    id: 'q_05',
    title: 'Scale Brand to ₹1,00,000 Monthly Revenue',
    description: 'Achieve stable 4.2x blended ROAS across all acquisition channels with 35% repeat customer rate.',
    category: 'BUSINESS',
    type: 'MAIN',
    difficulty: 'EPIC',
    rewardXp: 500,
    rewardCoins: 300,
    skillXpCategory: 'business',
    skillXpAmount: 200,
    status: 'ACTIVE',
    progressPercent: 52,
    requiredAction: 'Cross ₹50,000 monthly threshold'
  },
  {
    id: 'q_06',
    title: 'Overcome Supply Chain Bottleneck',
    description: 'Boss Mission: Negotiate 15% volume discount and 7-day turnaround SLA with fabric mill.',
    category: 'BUSINESS',
    type: 'BOSS',
    difficulty: 'EPIC',
    rewardXp: 350,
    rewardCoins: 200,
    skillXpCategory: 'communication',
    skillXpAmount: 150,
    status: 'ACTIVE',
    progressPercent: 40,
    requiredAction: 'Execute contract addendum'
  }
];

const initialGoals: Goal[] = [
  {
    id: 'g_01',
    title: '₹1,00,000 Monthly Business Revenue',
    category: 'BUSINESS',
    description: 'Build sustainable automated brand revenue with healthy 45% gross margins.',
    targetDate: '2026-11-30',
    progressPercent: 52,
    status: 'IN_PROGRESS',
    milestones: [
      { id: 'm_1', title: '₹10,000 Foundation Launch', targetValue: 10000, currentValue: 10000, unit: '₹', completed: true, rewardXp: 50 },
      { id: 'm_2', title: '₹25,000 Traction Milestone', targetValue: 25000, currentValue: 25000, unit: '₹', completed: true, rewardXp: 100 },
      { id: 'm_3', title: '₹50,000 Scale Milestone', targetValue: 50000, currentValue: 52000, unit: '₹', completed: true, rewardXp: 150 },
      { id: 'm_4', title: '₹75,000 Expansion Milestone', targetValue: 75000, currentValue: 52000, unit: '₹', completed: false, rewardXp: 200 },
      { id: 'm_5', title: '₹1,00,000 Sovereign Run-Rate', targetValue: 100000, currentValue: 52000, unit: '₹', completed: false, rewardXp: 500 },
    ]
  },
  {
    id: 'g_02',
    title: 'Master Autonomous AI Engineering',
    category: 'LEARNING',
    description: 'Develop production-grade autonomous agent clusters, RAG architectures, and custom toolsets.',
    targetDate: '2026-12-31',
    progressPercent: 68,
    status: 'IN_PROGRESS',
    milestones: [
      { id: 'm_6', title: 'Prompt Engineering & Vector Search', targetValue: 100, currentValue: 100, unit: '%', completed: true, rewardXp: 80 },
      { id: 'm_7', title: 'Multi-Agent State Orchestration', targetValue: 100, currentValue: 80, unit: '%', completed: false, rewardXp: 120 },
      { id: 'm_8', title: 'Production Tool Use & Security Sandboxing', targetValue: 100, currentValue: 40, unit: '%', completed: false, rewardXp: 160 },
    ]
  }
];

const initialSkills: SkillNode[] = [
  {
    id: 'sk_biz_marketing',
    name: 'Growth & Performance Marketing',
    category: 'BUSINESS',
    level: 4,
    maxLevel: 10,
    currentXp: 420,
    nextLevelXp: 600,
    unlocked: true,
    prerequisites: [],
    description: 'Paid ads optimization, creative testing, ROAS attribution, and funnel science.',
    practiceQuests: ['Analyze ad creative hook drop-off', 'Audit Meta campaign CBO allocation']
  },
  {
    id: 'sk_biz_sales',
    name: 'Deal Negotiation & Sales',
    category: 'BUSINESS',
    level: 3,
    maxLevel: 10,
    currentXp: 210,
    nextLevelXp: 450,
    unlocked: true,
    prerequisites: [],
    description: 'B2B outreach, high-ticket persuasion, supplier terms negotiation.',
    practiceQuests: ['Secure 10% lower bulk garment price', 'Close wholesale partner inquiry']
  },
  {
    id: 'sk_ai_agents',
    name: 'AI Agent Architecture',
    category: 'AI',
    level: 5,
    maxLevel: 10,
    currentXp: 750,
    nextLevelXp: 1000,
    unlocked: true,
    prerequisites: ['sk_ai_prompting'],
    description: 'Autonomous state machines, permission-gated execution, and distributed agent coordination.',
    practiceQuests: ['Implement approval-gated tool dispatcher', 'Build vector memory retrieval pipeline']
  },
  {
    id: 'sk_ai_prompting',
    name: 'Context Engineering & Prompting',
    category: 'AI',
    level: 7,
    maxLevel: 10,
    currentXp: 910,
    nextLevelXp: 1200,
    unlocked: true,
    prerequisites: [],
    description: 'Structured output schemas, meta-prompts, Chain-of-Thought steering.',
    practiceQuests: ['Create zero-hallucination extraction schema']
  },
  {
    id: 'sk_fin_budgeting',
    name: 'Cash Flow & Capital Allocation',
    category: 'FINANCE',
    level: 4,
    maxLevel: 10,
    currentXp: 380,
    nextLevelXp: 600,
    unlocked: true,
    prerequisites: [],
    description: 'Working capital management, runway forecasting, unit economics control.',
    practiceQuests: ['Audit monthly recurring subscriptions', 'Model 90-day cash buffer']
  },
  {
    id: 'sk_per_discipline',
    name: 'Focus & Deep Work Sovereignty',
    category: 'PERSONAL',
    level: 6,
    maxLevel: 10,
    currentXp: 630,
    nextLevelXp: 800,
    unlocked: true,
    prerequisites: [],
    description: 'Dopamine regulation, 90-minute ultradian rhythm cycles, zero-distraction protocol.',
    practiceQuests: ['Execute 3 consecutive 90-minute focus blocks without tab switching']
  }
];

const initialTransactions: FinanceTransaction[] = [
  { id: 'tx_01', date: '2026-09-24', title: 'Meta Ads - Autumn Drop Testing', amount: 500, type: 'EXPENSE', category: 'BUSINESS_ADS', scope: 'BUSINESS', notes: 'Top of funnel video creative testing' },
  { id: 'tx_02', date: '2026-09-23', title: 'Website E-commerce Sales Batch', amount: 8400, type: 'INCOME', category: 'OTHER', scope: 'BUSINESS', notes: 'Direct store orders' },
  { id: 'tx_03', date: '2026-09-22', title: 'Cloud Infrastructure & API Usage', amount: 1250, type: 'EXPENSE', category: 'SOFTWARE', scope: 'BUSINESS', notes: 'Supabase & AI models compute' },
  { id: 'tx_04', date: '2026-09-21', title: 'Supplier Sample Fabric Batch', amount: 3200, type: 'EXPENSE', category: 'INVENTORY', scope: 'BUSINESS', notes: 'High-GSM French Terry samples' },
  { id: 'tx_05', date: '2026-09-20', title: 'Weekly Nutrition & Supplements', amount: 1850, type: 'EXPENSE', category: 'LIVING', scope: 'PERSONAL', notes: 'High-protein diet groceries' },
];

const initialFinance: FinanceSummary = {
  monthlyIncome: 52000,
  monthlyExpenses: 31400,
  monthlySavings: 20600,
  budgetRemaining: 18400,
  businessExpenseRatio: 0.68,
  aiInsight: 'Meta Ads acquisition efficiency improved by 14% this week. Business runway is safely at 7.4 months.',
  transactions: initialTransactions
};

const initialMemories: MemoryItem[] = [
  {
    id: 'mem_01',
    type: 'DECISION',
    title: 'InkThread Quality Standard',
    content: 'We only use 280+ GSM pure organic combed cotton. Never cut corners on fabric feel or ribbed collar integrity.',
    source: 'Journal Entry 2026-09-15',
    importance: 'HIGH',
    createdAt: '2026-09-15T10:00:00Z',
    tags: ['Brand', 'Quality', 'Manufacturing']
  },
  {
    id: 'mem_02',
    type: 'USER_PREFERENCE',
    title: 'Communication & Briefing Protocol',
    content: 'Direct, actionable telemetry. No corporate fluff or filler language. Present recommendations as prepared action payloads.',
    source: 'System Initialization',
    importance: 'HIGH',
    createdAt: '2026-09-01T08:00:00Z',
    tags: ['MENTRA', 'Preferences']
  },
  {
    id: 'mem_03',
    type: 'PROJECT',
    title: 'Automated Micro-Drop Engine',
    content: 'Architecture for generating 10 high-concept graphic designs weekly, auto-publishing mockups, and launching ad sets automatically.',
    source: 'Strategy Session',
    importance: 'HIGH',
    createdAt: '2026-09-20T14:30:00Z',
    tags: ['Automation', 'AI Agents', 'Drop Architecture']
  }
];

const initialJournal: JournalEntry[] = [
  {
    id: 'j_01',
    date: '2026-09-23',
    rawContent: 'Great deep work session today. Optimized the ad creatives and finalized supplier negotiations for 280 GSM terry. Felt focused and grounded.',
    summary: 'Supplier negotiations succeeded; ad conversion rates climbed.',
    wins: ['Locked in 12% lower fabric cost', 'Maintained 4.5h of deep work state', 'Completed all 4 daily quests'],
    problems: ['Packaging vendor shipping delay of 2 days'],
    decisions: ['Buffer packaging stock by 200 units on every order'],
    lessons: ['Direct supplier calls produce faster discounts than email threads'],
    tomorrowActions: ['Launch Meta ads test batch', 'Reconcile weekly bank statements', 'Build MENTRA agent orchestrator'],
    mood: 'PEAK',
    tags: ['Business', 'Discipline', 'DeepWork'],
    extractedMemoryIds: ['mem_01']
  }
];

const initialAgents: MentraAgent[] = [
  {
    id: 'ag_research',
    name: 'Research Agent',
    role: 'Market & Deep Intelligence Scanner',
    description: 'Continuously scouts market opportunities, competitor pricing, and emerging technical breakthroughs.',
    status: 'WORKING',
    currentTask: 'Scraping trending design aesthetics & viral visual hooks',
    lastRun: '2 mins ago',
    permissionLevel: 'ANALYZE',
    requiresApproval: false,
    iconName: 'Compass',
    stats: { tasksCompleted: 142, accuracyRate: 98 }
  },
  {
    id: 'ag_gmail',
    name: 'Gmail Agent',
    role: 'Executive Inbox & Communication Gatekeeper',
    description: 'Screens urgent emails, drafts high-leverage replies, flags critical invoices and vendor alerts.',
    status: 'READY',
    currentTask: 'Monitoring for supplier quote responses',
    lastRun: '15 mins ago',
    permissionLevel: 'RECOMMEND',
    requiresApproval: true,
    iconName: 'Mail',
    stats: { tasksCompleted: 89, accuracyRate: 96 }
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
    stats: { tasksCompleted: 64, accuracyRate: 99 }
  },
  {
    id: 'ag_drive',
    name: 'Drive & Assets Agent',
    role: 'Digital Asset & Document Indexer',
    description: 'Synchronizes design mockups, financial sheets, and legal contracts into structured neural vector index.',
    status: 'IDLE',
    currentTask: 'Standing by for new design vector batch',
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
    status: 'MONITORING',
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
    currentTask: 'Roadmap generated: Python Multi-Agent Systems',
    lastRun: '4 hours ago',
    permissionLevel: 'RECOMMEND',
    requiresApproval: false,
    iconName: 'GraduationCap',
    stats: { tasksCompleted: 77, accuracyRate: 95 }
  },
  {
    id: 'ag_business',
    name: 'Business Agent',
    role: 'E-commerce & Operations Multiplier',
    description: 'Oversees product pipeline, conversion funnels, inventory alerts, and prepares executive weekly summaries.',
    status: 'AWAITING_APPROVAL',
    currentTask: 'Prepared weekly performance report for operator sign-off',
    lastRun: '10 mins ago',
    permissionLevel: 'PREPARE',
    requiresApproval: true,
    iconName: 'Briefcase',
    stats: { tasksCompleted: 103, accuracyRate: 97 }
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

const initialIntegrations: IntegrationConnection[] = [
  { id: 'int_gaccount', service: 'GOOGLE_ACCOUNT', name: 'Google Account', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '10 mins ago', description: 'Primary SSO and master identity verification.' },
  { id: 'int_gmail', service: 'GMAIL', name: 'Gmail Workspace', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '12 mins ago', description: 'Real-time inbox telemetry and draft assistant.' },
  { id: 'int_cal', service: 'GOOGLE_CALENDAR', name: 'Google Calendar', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '25 mins ago', description: 'Deep work block synchronization and event management.' },
  { id: 'int_drive', service: 'GOOGLE_DRIVE', name: 'Google Drive', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '1 hour ago', description: 'Mockup assets, tech packs, and brand guideline storage.' },
  { id: 'int_sheets', service: 'GOOGLE_SHEETS', name: 'Google Sheets', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '2 hours ago', description: 'Inventory, supplier bills, and cash flow ledgers.' },
  { id: 'int_contacts', service: 'GOOGLE_CONTACTS', name: 'Google Contacts', status: 'CONNECTED', accountEmail: 'operator.mentra@gmail.com', lastSync: '1 day ago', description: 'Supplier, agency, and logistics contact directory.' },
  { id: 'int_whatsapp', service: 'WHATSAPP_CLOUD_API', name: 'WhatsApp Cloud Gateway', status: 'CONNECTED', accountEmail: '+91 98XXX-XXXXX', lastSync: 'Real-time webhook active', description: 'Mobile natural language interface & instant executive audio memos.' },
];

const initialNotifications: MentraNotification[] = [
  { id: 'n_01', timestamp: '10m ago', type: 'AGENT', title: 'Business Agent Ready', message: 'Weekly performance report drafted. Awaiting your approval.', unread: true, priority: 'NORMAL' },
  { id: 'n_02', timestamp: '1h ago', type: 'FINANCE', title: 'Budget Allocation Alert', message: 'Meta Ads daily spend reached 65% of daily threshold.', unread: true, priority: 'LOW' },
  { id: 'n_03', timestamp: '3h ago', type: 'QUEST', title: 'Streak Maintained!', message: '14-Day Streak bonus unlocked: +50 XP and Sovereign Badge.', unread: false, priority: 'NORMAL' },
];

export const useMentraStore = create<MentraState>((set, get) => ({
  player: initialPlayer,
  quests: initialQuests,
  goals: initialGoals,
  skills: initialSkills,
  finance: initialFinance,
  journalEntries: initialJournal,
  memories: initialMemories,
  agents: initialAgents,
  integrations: initialIntegrations,
  notifications: initialNotifications,
  systemBooted: true,
  activeCommandResponse: null,

  bootSystem: () => set({ systemBooted: true }),

  completeQuest: (questId: string) => {
    const { quests, player } = get();
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status === 'COMPLETED') return;

    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, status: 'COMPLETED' as const, progressPercent: 100 } : q
    );

    let newXp = player.currentXp + quest.rewardXp;
    let newLevel = player.level;
    let nextLevelXp = player.nextLevelXp;

    if (newXp >= nextLevelXp) {
      newLevel += 1;
      newXp = newXp - nextLevelXp;
      nextLevelXp = Math.floor(nextLevelXp * 1.3);
    }

    const updatedStats: Record<string, any> = { ...player.stats };
    if (quest.skillXpCategory && quest.skillXpAmount) {
      const cat = quest.skillXpCategory;
      const currentVal = Number(updatedStats[cat]) || 50;
      updatedStats[cat] = Math.min(100, currentVal + Math.ceil(quest.skillXpAmount / 10));
    }

    set({
      quests: updatedQuests,
      player: {
        ...player,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp,
        totalQuestsCompleted: player.totalQuestsCompleted + 1,
        stats: updatedStats as PlayerStats
      },
      notifications: [
        {
          id: `n_${Date.now()}`,
          timestamp: 'Just now',
          type: 'QUEST',
          title: `Quest Completed: ${quest.title}`,
          message: `+${quest.rewardXp} XP awarded. Keep the momentum going!`,
          unread: true,
          priority: 'NORMAL'
        },
        ...get().notifications
      ]
    });
  },

  addXp: (amount: number, statCategory?: StatKey) => {
    const { player } = get();
    let newXp = player.currentXp + amount;
    let newLevel = player.level;
    let nextLevelXp = player.nextLevelXp;

    if (newXp >= nextLevelXp) {
      newLevel += 1;
      newXp = newXp - nextLevelXp;
      nextLevelXp = Math.floor(nextLevelXp * 1.3);
    }

    const updatedStats: Record<string, any> = { ...player.stats };
    if (statCategory) {
      const currentVal = Number(updatedStats[statCategory]) || 50;
      updatedStats[statCategory] = Math.min(100, currentVal + 2);
    }

    set({
      player: {
        ...player,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp,
        stats: updatedStats as PlayerStats
      }
    });
  },

  addTransaction: (tx) => {
    const newTx: FinanceTransaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...tx
    };

    const { finance } = get();
    const newExpenses = tx.type === 'EXPENSE' ? finance.monthlyExpenses + tx.amount : finance.monthlyExpenses;
    const newIncome = tx.type === 'INCOME' ? finance.monthlyIncome + tx.amount : finance.monthlyIncome;
    const newSavings = newIncome - newExpenses;

    set({
      finance: {
        ...finance,
        monthlyExpenses: newExpenses,
        monthlyIncome: newIncome,
        monthlySavings: newSavings,
        budgetRemaining: Math.max(0, finance.budgetRemaining - (tx.type === 'EXPENSE' ? tx.amount : 0)),
        transactions: [newTx, ...finance.transactions]
      },
      notifications: [
        {
          id: `n_${Date.now()}`,
          timestamp: 'Just now',
          type: 'FINANCE',
          title: `Transaction Recorded: ₹${tx.amount}`,
          message: `${tx.title} (${tx.scope}) logged successfully.`,
          unread: true,
          priority: 'NORMAL'
        },
        ...get().notifications
      ]
    });
  },

  addMemory: (item) => {
    const newMem: MemoryItem = {
      id: `mem_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...item
    };
    set({
      memories: [newMem, ...get().memories],
      notifications: [
        {
          id: `n_${Date.now()}`,
          timestamp: 'Just now',
          type: 'MEMORY',
          title: `Memory Synthesized: ${item.title}`,
          message: `Saved to neural vault under ${item.type}.`,
          unread: true,
          priority: 'LOW'
        },
        ...get().notifications
      ]
    });
  },

  addJournalEntry: (entry) => {
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      extractedMemoryIds: [],
      ...entry
    };
    set({
      journalEntries: [newEntry, ...get().journalEntries]
    });
    get().addXp(60, 'discipline');
  },

  updateAgentStatus: (agentId, status, currentTask) => {
    set({
      agents: get().agents.map(a => 
        a.id === agentId ? { ...a, status, currentTask: currentTask || a.currentTask, lastRun: 'Just now' } : a
      )
    });
  },

  approveAgentTask: (agentId) => {
    set({
      agents: get().agents.map(a => 
        a.id === agentId ? { ...a, status: 'WORKING', currentTask: 'Executing approved action payload...', requiresApproval: false } : a
      ),
      notifications: [
        {
          id: `n_${Date.now()}`,
          timestamp: 'Just now',
          type: 'AGENT',
          title: 'Action Approved',
          message: `Agent ${agentId} is now executing with elevated privileges.`,
          unread: true,
          priority: 'NORMAL'
        },
        ...get().notifications
      ]
    });
  },

  toggleIntegration: (id) => {
    set({
      integrations: get().integrations.map(int => 
        int.id === id ? { ...int, status: int.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : int
      )
    });
  },

  executeCommand: (query: string) => {
    const cleanQuery = query.toLowerCase().trim();

    // 1. Finance Expense command: e.g. "₹500 Meta Ads expense add karo" or "500 expense add karo"
    const expenseMatch = cleanQuery.match(/(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:ka|ko)?\s*(.*)(?:expense|kharcha|add)/i);
    if (expenseMatch) {
      const amount = parseInt(expenseMatch[1], 10);
      const title = expenseMatch[2].trim() || 'Command Logged Expense';
      get().addTransaction({
        title: title ? `Expense: ${title}` : 'Quick Command Expense',
        amount,
        type: 'EXPENSE',
        category: 'BUSINESS_ADS',
        scope: 'BUSINESS',
        notes: `Logged via natural language command: "${query}"`
      });
      const res = `[FINANCE AGENT]: Logged ₹${amount} expense for "${title}". Monthly budget remaining: ₹${get().finance.budgetRemaining}.`;
      set({ activeCommandResponse: res });
      return { success: true, message: res };
    }

    // 2. Daily Briefing: e.g. "MENTRA, aaj mujhe kya karna hai?" or "what should i do today"
    if (cleanQuery.includes('aaj') || cleanQuery.includes('today') || cleanQuery.includes('briefing') || cleanQuery.includes('kya karna')) {
      const activeQuests = get().quests.filter(q => q.status === 'ACTIVE');
      const res = `[MENTRA CORE]: Operator Naaz, you have ${activeQuests.length} active missions today. Primary priority: "${activeQuests[0]?.title || 'System Mastery'}". You are on a ${get().player.streakDays}-day streak at Level ${get().player.level}. All telemetry normal.`;
      set({ activeCommandResponse: res });
      return { success: true, message: res };
    }

    // 3. Learning command: e.g. "Mujhe Python seekhna hai"
    if (cleanQuery.includes('python') || cleanQuery.includes('seekhna') || cleanQuery.includes('learn')) {
      get().addXp(40, 'knowledge');
      const res = `[LEARNING AGENT]: Python Autonomous Agent roadmap accessed. Module 4 "Multi-Agent State Orchestration" ready. Daily practice quest initiated (+90 XP).`;
      set({ activeCommandResponse: res });
      return { success: true, message: res };
    }

    // 4. Memory query / remember: e.g. "What do you remember about InkThread" or "save memory"
    if (cleanQuery.includes('remember') || cleanQuery.includes('yaad') || cleanQuery.includes('memory') || cleanQuery.includes('inkthread')) {
      const res = `[MEMORY VAULT]: Retrieved 3 neural anchors: 1) 280+ GSM pure organic cotton standard, 2) Automated micro-drop architecture, 3) 45% target gross margin threshold.`;
      set({ activeCommandResponse: res });
      return { success: true, message: res };
    }

    // 5. Journal save command
    if (cleanQuery.includes('journal') || cleanQuery.includes('save journal')) {
      get().addJournalEntry({
        rawContent: `Quick log via MENTRA command: "${query}"`,
        summary: 'Operator submitted voice/text telemetry checkpoint.',
        wins: ['Dispatched priority command'],
        problems: [],
        decisions: ['Executed immediate action protocol'],
        lessons: ['Command-first interactions preserve momentum'],
        tomorrowActions: ['Review weekly agent throughput'],
        mood: 'PRODUCTIVE',
        tags: ['VoiceCommand', 'FastAction']
      });
      const res = `[JOURNAL AGENT]: Reflection checkpoint logged. Awarded +60 XP for discipline.`;
      set({ activeCommandResponse: res });
      return { success: true, message: res };
    }

    // Default Fallback Intelligent Command
    const res = `[MENTRA CORE]: Command processed: "${query}". Dispatched payload to Agent Cluster. Telemetry recorded in neural log.`;
    set({ activeCommandResponse: res });
    return { success: true, message: res };
  },

  clearCommandResponse: () => set({ activeCommandResponse: null }),

  syncUserDatabase: async (userId: string) => {
    try {
      const [p, prog, st, userQuests, userGoals, userSkills, userFin, userJour, userMems, userInts] = await Promise.all([
        getProfile(userId),
        getPlayerProgress(userId),
        getPlayerStats(userId),
        getUserQuests(userId),
        getUserGoals(userId),
        getUserSkills(userId),
        getUserFinance(userId),
        getUserJournal(userId),
        getUserMemories(userId),
        getUserIntegrations(userId)
      ]);

      const updatedPlayer: PlayerProfile = {
        id: userId,
        name: p?.display_name || 'Operator',
        codename: `MENTRA-${(p?.display_name || 'SOV').slice(0, 3).toUpperCase()}-01`,
        title: 'Vanguard Architect',
        level: prog?.level || 1,
        currentXp: prog?.current_xp || 0,
        nextLevelXp: (prog?.level || 1) * 1000,
        streakDays: prog?.current_streak || 1,
        totalQuestsCompleted: prog?.quests_completed || 0,
        rank: (prog?.level || 1) > 5 ? 'TACTICIAN' : 'NOVICE',
        stats: st || {
          focus: 50,
          discipline: 50,
          knowledge: 50,
          business: 50,
          finance: 50,
          communication: 50,
          fitness: 50
        }
      };

      set({
        player: updatedPlayer,
        quests: userQuests.length > 0 ? userQuests : get().quests,
        goals: userGoals.length > 0 ? userGoals : get().goals,
        skills: userSkills.length > 0 ? userSkills : get().skills,
        finance: userFin.transactions.length > 0 ? userFin : get().finance,
        journalEntries: userJour.length > 0 ? userJour : get().journalEntries,
        memories: userMems.length > 0 ? userMems : get().memories,
        integrations: userInts.length > 0 ? userInts : get().integrations
      });
    } catch (err) {
      console.warn('[MENTRA STORE]: Database sync fallback:', err);
    }
  },

  resetToNewUser: (name: string, userId: string) => {
    const newPlayer: PlayerProfile = {
      id: userId,
      name,
      codename: `MENTRA-${name.slice(0, 3).toUpperCase()}-01`,
      title: 'Initiate Operator',
      level: 1,
      currentXp: 0,
      nextLevelXp: 1000,
      streakDays: 1,
      totalQuestsCompleted: 0,
      rank: 'NOVICE',
      stats: {
        focus: 20,
        discipline: 20,
        knowledge: 20,
        business: 20,
        finance: 20,
        communication: 20,
        fitness: 20
      }
    };

    set({
      player: newPlayer,
      quests: [],
      goals: [],
      finance: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlySavings: 0,
        budgetRemaining: 0,
        businessExpenseRatio: 0,
        aiInsight: 'Financial telemetry initialized. Ready to log your first income or expense.',
        transactions: []
      },
      journalEntries: [],
      memories: [],
      notifications: [
        {
          id: `n_${Date.now()}`,
          timestamp: 'Just now',
          type: 'SYSTEM',
          title: 'System Initialized',
          message: `Welcome, ${name}. MENTRA Personal AI Operating System is active.`,
          unread: true,
          priority: 'NORMAL'
        }
      ]
    });
  }
}));
