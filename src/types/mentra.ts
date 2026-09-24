export type QuestType = 'DAILY' | 'MAIN' | 'SIDE' | 'BOSS';
export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type QuestCategory = 'BUSINESS' | 'FINANCE' | 'FITNESS' | 'LEARNING' | 'PERSONAL_GROWTH';
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'LOCKED';

export interface PlayerStats {
  focus: number;
  discipline: number;
  knowledge: number;
  business: number;
  finance: number;
  communication: number;
  fitness: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  codename: string;
  title: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  totalQuestsCompleted: number;
  stats: PlayerStats;
  rank: 'NOVICE' | 'APPRENTICE' | 'OPERATOR' | 'TACTICIAN' | 'ARCHITECT' | 'SOVEREIGN';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  type: QuestType;
  difficulty: QuestDifficulty;
  rewardXp: number;
  rewardCoins: number;
  skillXpCategory?: keyof PlayerStats;
  skillXpAmount?: number;
  status: QuestStatus;
  deadline?: string;
  progressPercent: number;
  requiredAction?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  rewardXp: number;
}

export interface Goal {
  id: string;
  title: string;
  category: QuestCategory;
  description: string;
  targetDate: string;
  progressPercent: number;
  milestones: GoalMilestone[];
  status: 'IN_PROGRESS' | 'ACHIEVED' | 'PAUSED';
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'BUSINESS' | 'AI' | 'FINANCE' | 'PERSONAL';
  level: number;
  maxLevel: number;
  currentXp: number;
  nextLevelXp: number;
  unlocked: boolean;
  prerequisites: string[];
  description: string;
  practiceQuests: string[];
}

export interface FinanceTransaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'BUSINESS_ADS' | 'INVENTORY' | 'LOGISTICS' | 'SOFTWARE' | 'LIVING' | 'INVESTMENT' | 'OTHER';
  scope: 'BUSINESS' | 'PERSONAL';
  notes?: string;
}

export interface FinanceSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  budgetRemaining: number;
  businessExpenseRatio: number;
  aiInsight: string;
  transactions: FinanceTransaction[];
}

export interface JournalEntry {
  id: string;
  date: string;
  rawContent: string;
  summary: string;
  wins: string[];
  problems: string[];
  decisions: string[];
  lessons: string[];
  tomorrowActions: string[];
  mood: 'PEAK' | 'PRODUCTIVE' | 'NEUTRAL' | 'EXHAUSTED' | 'REFLECTIVE';
  tags: string[];
  extractedMemoryIds: string[];
}

export type MemoryType = 'DECISION' | 'IDEA' | 'PROJECT' | 'PEOPLE' | 'GOAL' | 'JOURNAL_INSIGHT' | 'USER_PREFERENCE';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  source: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  tags: string[];
}

export type AgentStatus = 'READY' | 'WORKING' | 'MONITORING' | 'IDLE' | 'AWAITING_APPROVAL' | 'ERROR';
export type AgentPermissionLevel = 'READ' | 'ANALYZE' | 'RECOMMEND' | 'PREPARE' | 'EXECUTE';

export interface MentraAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  lastRun: string;
  permissionLevel: AgentPermissionLevel;
  requiresApproval: boolean;
  iconName: string;
  stats: {
    tasksCompleted: number;
    accuracyRate: number;
  };
}

export interface IntegrationConnection {
  id: string;
  service: 'GOOGLE_ACCOUNT' | 'GMAIL' | 'GOOGLE_CALENDAR' | 'GOOGLE_DRIVE' | 'GOOGLE_SHEETS' | 'GOOGLE_CONTACTS' | 'WHATSAPP_CLOUD_API';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SANDBOX_MODE';
  lastSync?: string;
  accountEmail?: string;
  description: string;
}

export interface MentraNotification {
  id: string;
  timestamp: string;
  type: 'QUEST' | 'AGENT' | 'FINANCE' | 'CALENDAR' | 'MEMORY';
  title: string;
  message: string;
  unread: boolean;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
}
