export type QuestType = 'DAILY' | 'MAIN' | 'SIDE' | 'WEEKLY' | 'BOSS' | 'RECOVERY' | 'LEARNING' | 'PRACTICE';
export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC' | 'ELITE' | 'BOSS';
export type QuestCategory = 'BUSINESS' | 'FINANCE' | 'FITNESS' | 'LEARNING' | 'PERSONAL_GROWTH' | 'DISCIPLINE' | 'COMMUNICATION';
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'EXPIRED';

export type StatKey = 'discipline' | 'focus' | 'knowledge' | 'business' | 'finance' | 'communication' | 'fitness';

export interface PlayerStats {
  discipline: number;
  focus: number;
  knowledge: number;
  business: number;
  finance: number;
  communication: number;
  fitness: number;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  timezone: string;
  preferred_language: string;
  onboarding_completed: boolean;
  primary_goal?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerProgress {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  quests_completed: number;
  created_at?: string;
  updated_at?: string;
}

// Backward-compatible interface for UI components
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
  user_id?: string;
  title: string;
  description: string;
  category: QuestCategory;
  type: QuestType;
  difficulty: QuestDifficulty;
  rewardXp: number;
  rewardCoins?: number;
  skillXpCategory?: keyof PlayerStats;
  skillXpAmount?: number;
  skill_id?: string;
  goal_id?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: QuestStatus;
  due_date?: string;
  deadline?: string;
  completed_at?: string;
  progressPercent: number;
  requiredAction?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoalMilestone {
  id: string;
  goal_id?: string;
  user_id?: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  due_date?: string;
  rewardXp: number;
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: QuestCategory;
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  target_date?: string;
  targetDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  progressPercent: number;
  milestones: GoalMilestone[];
  status: 'IN_PROGRESS' | 'ACHIEVED' | 'PAUSED' | 'FAILED';
  created_at?: string;
  updated_at?: string;
}

export interface SkillNode {
  id: string;
  user_id?: string;
  name: string;
  category: 'BUSINESS' | 'AI' | 'FINANCE' | 'PERSONAL' | 'COMMUNICATION';
  level: number;
  maxLevel: number;
  currentXp: number;
  nextLevelXp: number;
  target_level?: number;
  unlocked: boolean;
  status?: 'ACTIVE' | 'LOCKED' | 'MASTERED';
  prerequisites: string[];
  description: string;
  practiceQuests: string[];
  roadmap?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface FinanceTransaction {
  id: string;
  user_id?: string;
  date: string;
  title: string;
  description?: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'BUSINESS_ADS' | 'INVENTORY' | 'LOGISTICS' | 'SOFTWARE' | 'LIVING' | 'INVESTMENT' | 'OTHER';
  business_personal?: 'BUSINESS' | 'PERSONAL';
  scope: 'BUSINESS' | 'PERSONAL';
  account_source?: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category: string;
  monthly_limit: number;
  current_spend: number;
  created_at?: string;
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
  user_id?: string;
  date: string;
  entry_date?: string;
  title?: string;
  rawContent: string;
  content?: string;
  summary: string;
  wins: string[];
  problems: string[];
  decisions: string[];
  ideas?: string[];
  lessons: string[];
  tomorrow_actions?: string[];
  tomorrowActions: string[];
  mood: 'PEAK' | 'PRODUCTIVE' | 'NEUTRAL' | 'EXHAUSTED' | 'REFLECTIVE';
  tags: string[];
  ai_summary?: string;
  extractedMemoryIds: string[];
  created_at?: string;
  updated_at?: string;
}

export type MemoryType = 
  | 'Preference' 
  | 'Decision' 
  | 'Goal' 
  | 'Project' 
  | 'Idea' 
  | 'JournalInsight' 
  | 'Person' 
  | 'TaskContext' 
  | 'BusinessContext'
  | 'LearningInsight'
  | 'SkillWeakness'
  | 'SkillStrength'
  | 'DECISION'
  | 'IDEA'
  | 'PROJECT'
  | 'PEOPLE'
  | 'USER_PREFERENCE';

export interface MemoryItem {
  id: string;
  user_id?: string;
  type: MemoryType;
  title: string;
  content: string;
  source?: string;
  source_id?: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
}

export type AgentStatus = 'IDLE' | 'READY' | 'WORKING' | 'MONITORING' | 'WAITING_APPROVAL' | 'AWAITING_APPROVAL' | 'COMPLETE' | 'FAILED' | 'ERROR';
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

export interface AgentRun {
  id: string;
  user_id: string;
  agent_id: string;
  status: AgentStatus;
  task_payload?: Record<string, unknown>;
  result_payload?: Record<string, unknown>;
  permission_level: AgentPermissionLevel;
  requires_approval: boolean;
  approved_by_user: boolean;
  created_at: string;
}

export interface AgentApproval {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  description: string;
  action_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface IntegrationConnection {
  id: string;
  user_id?: string;
  provider?: string;
  service: 'GOOGLE_ACCOUNT' | 'GMAIL' | 'GOOGLE_CALENDAR' | 'GOOGLE_DRIVE' | 'GOOGLE_SHEETS' | 'GOOGLE_CONTACTS' | 'WHATSAPP_CLOUD_API';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ACTION_REQUIRED' | 'SANDBOX_MODE';
  lastSync?: string;
  accountEmail?: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface MentraNotification {
  id: string;
  user_id?: string;
  timestamp: string;
  type: 'QUEST' | 'AGENT' | 'FINANCE' | 'CALENDAR' | 'MEMORY' | 'SYSTEM' | 'SKILL' | 'LEVEL_UP';
  title: string;
  message: string;
  unread: boolean;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
  created_at?: string;
}

export interface Achievement {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  module: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// ==============================================================================
// ADAPTIVE SKILL LEARNING ENGINE TYPES
// ==============================================================================

export interface LearningProfile {
  id: string;
  user_id: string;
  skill_id: string;
  why_learn: string;
  current_experience: string;
  target_goal: string;
  time_available_mins: number;
  target_date?: string;
  preferred_language: string;
  learning_preference: string;
  main_difficulty?: string;
  current_weaknesses: string[];
  current_strengths: string[];
  baseline_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SkillRoadmap {
  id: string;
  user_id: string;
  skill_id: string;
  title: string;
  total_modules: number;
  completed_modules: number;
  completion_percent: number;
  current_level: number;
  target_level: number;
  modules?: SkillModule[];
  created_at?: string;
  updated_at?: string;
}

export interface SkillModule {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  description?: string;
  order_index: number;
  required_level: number;
  estimated_duration?: string;
  completed: boolean;
  lessons?: SkillLesson[];
  created_at?: string;
}

export interface SkillLesson {
  id: string;
  module_id: string;
  user_id: string;
  title: string;
  concept_summary: string;
  demonstration_example?: string;
  framework_steps?: string[];
  order_index: number;
  xp_reward: number;
  skill_xp_reward: number;
  completed: boolean;
  completed_at?: string;
  exercises?: SkillExercise[];
  created_at?: string;
}

export interface SkillExercise {
  id: string;
  lesson_id: string;
  user_id: string;
  title: string;
  prompt: string;
  exercise_type: 'SPEAKING_OR_TEXT' | 'AUDIO_RECORD' | 'TEXT_PRACTICE' | 'TIMED_CHALLENGE' | 'REAL_WORLD';
  duration_seconds: number;
  xp_reward: number;
  skill_xp_reward: number;
  created_at?: string;
}

export interface PracticeMetrics {
  duration_seconds?: number;
  estimated_words?: number;
  speaking_rate_wpm?: number;
  pause_count?: number;
  long_pauses?: number;
  filler_words_count?: number;
  repeated_words_count?: number;
}

export interface PracticeFeedback {
  clarity_feedback?: string;
  structure_feedback?: string;
  opening_feedback?: string;
  closing_feedback?: string;
  strengths: string[];
  improvements: string[];
  next_focus: string;
  ai_analysis_status: 'AVAILABLE' | 'UNAVAILABLE_AWAITING_AI_CORE' | 'MANUAL_SELF_EVALUATION';
}

export interface PracticeAttempt {
  id: string;
  user_id: string;
  skill_id: string;
  exercise_id?: string;
  attempt_number: number;
  transcript?: string;
  audio_url?: string;
  duration_seconds: number;
  self_rating: number;
  metrics: PracticeMetrics;
  feedback: PracticeFeedback;
  created_at?: string;
}

export interface BossObjective {
  id: string;
  boss_mission_id: string;
  user_id: string;
  title: string;
  is_mandatory: boolean;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface BossMission {
  id: string;
  user_id: string;
  skill_id?: string;
  title: string;
  description: string;
  reward_xp: number;
  reward_skill_xp: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  objectives: BossObjective[];
  completed_at?: string;
  created_at?: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  source_type: 'QUEST' | 'BOSS_MISSION' | 'DAILY' | 'SKILL_MILESTONE';
  source_id?: string;
  what_went_well: string;
  what_was_difficult?: string;
  what_did_you_learn: string;
  what_will_you_change?: string;
  converted_to_memory: boolean;
  memory_id?: string;
  created_at?: string;
}

// Standardized Reward Matrix
export const QUEST_REWARD_RULES: Record<QuestDifficulty, { xp: number; coins: number; skillXp: number }> = {
  EASY: { xp: 40, coins: 25, skillXp: 15 },
  MEDIUM: { xp: 80, coins: 50, skillXp: 30 },
  HARD: { xp: 150, coins: 90, skillXp: 60 },
  EPIC: { xp: 300, coins: 180, skillXp: 120 },
  ELITE: { xp: 350, coins: 200, skillXp: 140 },
  BOSS: { xp: 500, coins: 300, skillXp: 200 }
};
