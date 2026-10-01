-- ==============================================================================
-- MENTRA COMPLETE MASTER DATABASE SCHEMA (ALL TABLES & MIGRATIONS)
-- ==============================================================================


-- >>> START: 20260924_phase2_complete_schema.sql >>>
-- ==============================================================================
-- MENTRA PERSONAL AI OPERATING SYSTEM & LIFE RPG
-- Complete Phase 2 Database Architecture & Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferred_language TEXT DEFAULT 'en',
  primary_goal TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Player Progress Table
CREATE TABLE IF NOT EXISTS public.player_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  quests_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Player Stats Table (RPG Attributes)
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline INT DEFAULT 10,
  focus INT DEFAULT 10,
  knowledge INT DEFAULT 10,
  business INT DEFAULT 10,
  finance INT DEFAULT 10,
  communication INT DEFAULT 10,
  fitness INT DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. XP Transactions Table (Secure XP Ledger, prevents duplicate rewards)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('QUEST', 'GOAL_MILESTONE', 'SKILL_PRACTICE', 'JOURNAL_LOG', 'STREAK_BONUS', 'MANUAL')),
  source_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quests Table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DAILY', 'MAIN', 'SIDE', 'WEEKLY', 'BOSS', 'RECOVERY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED', 'SKIPPED', 'EXPIRED')),
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EPIC')),
  category TEXT NOT NULL DEFAULT 'PERSONAL_GROWTH',
  xp_reward INT NOT NULL DEFAULT 50,
  skill_xp_reward INT DEFAULT 25,
  skill_id UUID,
  goal_id UUID,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INT DEFAULT 0,
  required_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quest Completions (Prevents duplicate completion claims)
CREATE TABLE IF NOT EXISTS public.quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_awarded INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

-- 8. Goals & Goal Milestones
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'BUSINESS',
  target_value NUMERIC(12, 2) DEFAULT 100,
  current_value NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT '%',
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'ACHIEVED', 'PAUSED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC(12, 2) DEFAULT 100,
  current_value NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT '%',
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  reward_xp INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Skills & User Skills
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  roadmap JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  target_level INT DEFAULT 10,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'MASTERED')),
  practice_quests JSONB DEFAULT '[]'::jsonb,
  roadmap JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Journal Reflections Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  mood TEXT DEFAULT 'PRODUCTIVE',
  wins JSONB DEFAULT '[]'::jsonb,
  problems JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  lessons JSONB DEFAULT '[]'::jsonb,
  tomorrow_actions JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Finance Categories, Transactions, Budgets
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  business_personal TEXT DEFAULT 'BUSINESS' CHECK (business_personal IN ('BUSINESS', 'PERSONAL')),
  account_source TEXT DEFAULT 'PRIMARY_ACCOUNT',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  current_spend NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Memory Vault Table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  source_id TEXT,
  importance TEXT DEFAULT 'MEDIUM' CHECK (importance IN ('HIGH', 'MEDIUM', 'LOW')),
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Agents, Runs & Approvals
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  default_permission TEXT DEFAULT 'ANALYZE'
);

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  task_payload JSONB,
  result_payload JSONB,
  permission_level TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Integrations Table (Google & WhatsApp)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ACTION_REQUIRED', 'SANDBOX_MODE')),
  credentials JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 15. Notifications, Achievements, Activity Logs
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  unread BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'URGENT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY access rows where auth.uid() = user_id
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_owner_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Player Progress
CREATE POLICY "progress_owner_select" ON public.player_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_owner_insert" ON public.player_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_owner_update" ON public.player_progress FOR UPDATE USING (auth.uid() = user_id);

-- Player Stats
CREATE POLICY "stats_owner_all" ON public.player_stats FOR ALL USING (auth.uid() = user_id);

-- XP Transactions
CREATE POLICY "xp_owner_all" ON public.xp_transactions FOR ALL USING (auth.uid() = user_id);

-- Quests & Completions
CREATE POLICY "quests_owner_all" ON public.quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "completions_owner_all" ON public.quest_completions FOR ALL USING (auth.uid() = user_id);

-- Goals & Milestones
CREATE POLICY "goals_owner_all" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "milestones_owner_all" ON public.goal_milestones FOR ALL USING (auth.uid() = user_id);

-- Skills
CREATE POLICY "skills_owner_all" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- Journal
CREATE POLICY "journal_owner_all" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- Finance
CREATE POLICY "finance_cat_owner_all" ON public.finance_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "finance_tx_owner_all" ON public.finance_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "budgets_owner_all" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Memories
CREATE POLICY "memories_owner_all" ON public.memories FOR ALL USING (auth.uid() = user_id);

-- Agents
CREATE POLICY "agent_runs_owner_all" ON public.agent_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_app_owner_all" ON public.agent_approvals FOR ALL USING (auth.uid() = user_id);

-- Integrations
CREATE POLICY "integrations_owner_all" ON public.integrations FOR ALL USING (auth.uid() = user_id);

-- Notifications, Achievements, Activity Logs
CREATE POLICY "notifications_owner_all" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "achievements_owner_all" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_owner_all" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260924_phase2_complete_schema.sql <<<


-- >>> START: 20260924_phase2_mentra_schema.sql >>>
-- ==============================================================================
-- MENTRA PERSONAL AI OPERATING SYSTEM & LIFE RPG
-- Phase 2 Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferred_language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  primary_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Player Progress Table
CREATE TABLE IF NOT EXISTS public.player_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  quests_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Player Stats Table
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline INT DEFAULT 10,
  focus INT DEFAULT 10,
  knowledge INT DEFAULT 10,
  business INT DEFAULT 10,
  finance INT DEFAULT 10,
  communication INT DEFAULT 10,
  fitness INT DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quests Table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DAILY', 'MAIN', 'SIDE', 'WEEKLY', 'BOSS', 'RECOVERY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED', 'SKIPPED', 'EXPIRED')),
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EPIC')),
  category TEXT NOT NULL DEFAULT 'PERSONAL_GROWTH',
  xp_reward INT NOT NULL DEFAULT 50,
  skill_xp_reward INT DEFAULT 25,
  skill_id UUID,
  goal_id UUID,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INT DEFAULT 0,
  required_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Goals & Milestones Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'BUSINESS',
  target_value NUMERIC(12, 2) DEFAULT 100,
  current_value NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT '%',
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'ACHIEVED', 'PAUSED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC(12, 2) DEFAULT 100,
  current_value NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT '%',
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  reward_xp INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Skills & User Skills
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  roadmap JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  target_level INT DEFAULT 10,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'MASTERED')),
  practice_quests JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Journal Reflections Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  mood TEXT DEFAULT 'PRODUCTIVE',
  wins JSONB DEFAULT '[]'::jsonb,
  problems JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  lessons JSONB DEFAULT '[]'::jsonb,
  tomorrow_actions JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Finance Transactions, Categories, Budgets
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  business_personal TEXT DEFAULT 'PERSONAL' CHECK (business_personal IN ('BUSINESS', 'PERSONAL')),
  account_source TEXT DEFAULT 'PRIMARY_ACCOUNT',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  current_spend NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Memory Vault Table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  source_id TEXT,
  importance TEXT DEFAULT 'MEDIUM' CHECK (importance IN ('HIGH', 'MEDIUM', 'LOW')),
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Agents, Runs & Approvals
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  default_permission TEXT DEFAULT 'ANALYZE'
);

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  task_payload JSONB,
  result_payload JSONB,
  permission_level TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ACTION_REQUIRED', 'SANDBOX_MODE')),
  credentials JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 13. Notifications, Achievements, Activity Logs
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  unread BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'URGENT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY access records where auth.uid() = user_id
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Player Progress Policies
CREATE POLICY "Users can view their own progress" ON public.player_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.player_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.player_progress FOR UPDATE USING (auth.uid() = user_id);

-- Player Stats Policies
CREATE POLICY "Users can view their own stats" ON public.player_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON public.player_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.player_stats FOR UPDATE USING (auth.uid() = user_id);

-- Quests Policies
CREATE POLICY "Users can view their own quests" ON public.quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quests" ON public.quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quests" ON public.quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quests" ON public.quests FOR DELETE USING (auth.uid() = user_id);

-- Goals & Milestones Policies
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goal milestones" ON public.goal_milestones FOR ALL USING (auth.uid() = user_id);

-- User Skills Policies
CREATE POLICY "Users can manage their user skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- Journal Entries Policies
CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- Finance Policies
CREATE POLICY "Users can manage their own finance categories" ON public.finance_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own finance transactions" ON public.finance_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Memory Policies
CREATE POLICY "Users can manage their own memories" ON public.memories FOR ALL USING (auth.uid() = user_id);

-- Agent Runs & Approvals Policies
CREATE POLICY "Users can manage their agent runs" ON public.agent_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their agent approvals" ON public.agent_approvals FOR ALL USING (auth.uid() = user_id);

-- Integrations Policies
CREATE POLICY "Users can manage their integrations" ON public.integrations FOR ALL USING (auth.uid() = user_id);

-- Notifications, Achievements, Activity Logs Policies
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their activity logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260924_phase2_mentra_schema.sql <<<


-- >>> START: 20260925_phase11_feedback_evals_improvements_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 11: FEEDBACK INTELLIGENCE, CORRECTIONS & EVALS SCHEMA
-- ==============================================================================

-- 1. User Feedback Table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- 'MENTRA_CHAT', 'RECOMMENDATION', 'LEARNING', 'DAILY_PLAN', 'ROUTINE', 'MISSION'
    response_id TEXT,
    conversation_id TEXT,
    agent_run_id TEXT,
    recommendation_id TEXT,
    rating TEXT NOT NULL, -- 'HELPFUL', 'NOT_HELPFUL', 'EXCELLENT', 'WRONG_FACT', 'TOO_LONG', 'TOO_SHORT', 'BAD_TIMING'
    reason TEXT,
    optional_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback"
    ON public.user_feedback FOR ALL
    USING (auth.uid() = user_id);

-- 2. User Corrections Table
CREATE TABLE IF NOT EXISTS public.user_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    correction_type TEXT NOT NULL, -- 'WRONG_FACT', 'OUTDATED_FACT', 'WRONG_PREFERENCE', 'WRONG_PRIORITY', 'WRONG_PROJECT', 'WRONG_DATE'
    target_entity_type TEXT NOT NULL, -- 'GOAL', 'PROJECT', 'PREFERENCE', 'MEMORY', 'HABIT'
    target_entity_id TEXT,
    old_value TEXT,
    new_value TEXT NOT NULL,
    is_durable BOOLEAN NOT NULL DEFAULT TRUE, -- false for temporary day context
    status TEXT NOT NULL DEFAULT 'APPLIED', -- 'APPLIED', 'REVERTED', 'PENDING'
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own corrections"
    ON public.user_corrections FOR ALL
    USING (auth.uid() = user_id);

-- 3. Prompt Versions Registry Table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name TEXT NOT NULL,
    version TEXT NOT NULL, -- e.g. 'v1.0.0', 'v1.1.0'
    template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (prompt_name, version)
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt versions readable by authenticated users"
    ON public.prompt_versions FOR SELECT
    USING (true);

-- 4. System Issues & Error Clustering Table
CREATE TABLE IF NOT EXISTS public.system_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type TEXT NOT NULL, -- 'AI_MALFORMED_TOOL', 'OAUTH_TOKEN_EXPIRED', 'AGENT_TIMEOUT', 'WHATSAPP_REPLAY'
    severity TEXT NOT NULL DEFAULT 'SEV3', -- 'SEV1', 'SEV2', 'SEV3', 'SEV4'
    module TEXT NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    sample_run_id TEXT,
    status TEXT NOT NULL DEFAULT 'DETECTED', -- 'DETECTED', 'INVESTIGATING', 'RESOLVED'
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System issues viewable by authenticated users"
    ON public.system_issues FOR SELECT
    USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_feature ON public.user_feedback(user_id, feature, created_at);
CREATE INDEX IF NOT EXISTS idx_user_corrections_user_type ON public.user_corrections(user_id, target_entity_type);
CREATE INDEX IF NOT EXISTS idx_system_issues_module ON public.system_issues(module, status);

-- <<< END: 20260925_phase11_feedback_evals_improvements_schema.sql <<<


-- >>> START: 20260925_phase12_creator_business_workspace_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 12: CREATOR + BUSINESS WORKSPACE SCHEMA
-- ==============================================================================

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    business_type TEXT DEFAULT 'E_COMMERCE', -- 'E_COMMERCE', 'CREATOR', 'AGENCY', 'SAAS', 'SERVICE'
    website TEXT,
    primary_market TEXT DEFAULT 'India',
    target_audience TEXT,
    brand_voice TEXT DEFAULT 'Direct, Modern, Relatable',
    currency TEXT DEFAULT 'INR',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    primary_goal TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own businesses"
    ON public.businesses FOR ALL
    USING (auth.uid() = user_id);

-- 2. Brand Profiles Table
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tagline TEXT,
    positioning TEXT,
    visual_direction TEXT,
    content_style TEXT,
    do_not_use TEXT[],
    preferred_channels TEXT[],
    product_categories TEXT[],
    price_positioning TEXT, -- 'BUDGET', 'MID_TIER', 'PREMIUM', 'LUXURY'
    core_messages TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand profiles"
    ON public.brand_profiles FOR ALL
    USING (auth.uid() = user_id);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    sku TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) DEFAULT 0,
    margin NUMERIC(5, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'IDEA', 'DEVELOPMENT', 'READY', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'
    description TEXT,
    image_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
    ON public.products FOR ALL
    USING (auth.uid() = user_id);

-- 4. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT NOT NULL, -- 'PRODUCT_LAUNCH', 'SALES', 'AWARENESS', 'GROWTH', 'RETARGETING'
    audience TEXT,
    offer TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12, 2) DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    channels TEXT[], -- 'INSTAGRAM', 'FACEBOOK_ADS', 'WHATSAPP', 'EMAIL', 'WEBSITE'
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PLANNED', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'
    goal_id TEXT,
    project_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own campaigns"
    ON public.campaigns FOR ALL
    USING (auth.uid() = user_id);

-- 5. Content Items Table (Creator Pipeline)
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'EMAIL', 'WEBSITE', 'YOUTUBE'
    content_type TEXT NOT NULL, -- 'REEL', 'CAROUSEL', 'POST', 'STORY', 'AD_CREATIVE', 'EMAIL', 'WHATSAPP_DRAFT'
    title TEXT NOT NULL,
    hook TEXT,
    caption TEXT,
    script TEXT,
    cta TEXT,
    hashtags TEXT[],
    creative_brief JSONB,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'IDEA', 'RESEARCHED', 'PLANNED', 'DRAFT', 'CREATIVE_READY', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    external_post_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own content items"
    ON public.content_items FOR ALL
    USING (auth.uid() = user_id);

-- 6. Creative Assets Table
CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'IMAGE', 'VIDEO', 'LOGO_REFERENCE', 'PRODUCT_IMAGE', 'DESIGN_ARTWORK', 'THUMBNAIL', 'DOCUMENT', 'COPY'
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY', -- 'REQUESTED', 'GENERATING', 'READY', 'REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'
    storage_url TEXT,
    external_url TEXT,
    dimensions TEXT,
    duration_seconds INTEGER,
    prompt_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own creative assets"
    ON public.creative_assets FOR ALL
    USING (auth.uid() = user_id);

-- 7. Research Opportunities Table
CREATE TABLE IF NOT EXISTS public.research_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'MARKET_TREND', 'COMPETITOR_GAP', 'PRODUCT_CONCEPT', 'AUDIENCE_NEED'
    evidence TEXT NOT NULL,
    target_audience TEXT,
    suggested_experiment TEXT,
    status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'VALIDATING', 'ACCEPTED', 'REJECTED', 'TESTING', 'PROVEN'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own research opportunities"
    ON public.research_opportunities FOR ALL
    USING (auth.uid() = user_id);

-- 8. Business Experiments Table
CREATE TABLE IF NOT EXISTS public.business_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    variant_a TEXT NOT NULL,
    variant_b TEXT NOT NULL,
    metric TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'RUNNING', 'CONCLUDED'
    result_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business experiments"
    ON public.business_experiments FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for performance and scoping
CREATE INDEX IF NOT EXISTS idx_businesses_user ON public.businesses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON public.campaigns(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_business_status ON public.content_items(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_campaign ON public.creative_assets(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_research_opportunities_business ON public.research_opportunities(business_id, status);

-- <<< END: 20260925_phase12_creator_business_workspace_schema.sql <<<


-- >>> START: 20260925_phase13_team_collaboration_schema.sql >>>
-- ====================================================================
-- MENTRA PHASE 13: SECURE TEAM & COLLABORATION LAYER SCHEMA
-- ====================================================================

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS', 'TEAM')),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Workspace Invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Workspace Tasks
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'LAUNCH_CRITICAL')),
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETE', 'CANCELLED')),
    blocker_reason TEXT,
    review_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Workspace Comments & Mentions
CREATE TABLE IF NOT EXISTS public.workspace_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Workspace Activity & Audit Trail
CREATE TABLE IF NOT EXISTS public.workspace_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Workspace Approval Policies
CREATE TABLE IF NOT EXISTS public.workspace_approval_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    min_role TEXT NOT NULL CHECK (min_role IN ('OWNER', 'ADMIN', 'MANAGER', 'EDITOR')),
    requires_review BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, action_type)
);

-- 8. Workspace Memory Vault (Shared Business Knowledge)
CREATE TABLE IF NOT EXISTS public.workspace_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('BUSINESS_DECISION', 'SUPPLIER_CONTEXT', 'CAMPAIGN_LEARNING', 'PRODUCT_INSIGHT', 'PROCESS', 'POLICY', 'PROJECT_CONTEXT', 'TEAM_DECISION')),
    content TEXT NOT NULL,
    confidence NUMERIC(3,2) DEFAULT 0.90,
    source TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_ws_status ON public.workspace_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned ON public.workspace_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_task ON public.workspace_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_ws ON public.workspace_activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_memories_ws ON public.workspace_memories(workspace_id, category);

-- Enable RLS on all workspace tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memories ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks with explicit search_path
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = u_id
          AND status = 'ACTIVE'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = u_id
          AND status = 'ACTIVE'
          AND role IN ('OWNER', 'ADMIN')
    );
$$;

-- RLS Policies (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces" ON public.workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (
        owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid()) OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can manage workspace members" ON public.workspace_members;
CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
    FOR ALL USING (
        public.is_workspace_admin_or_owner(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can view workspace tasks" ON public.workspace_tasks
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can insert workspace tasks" ON public.workspace_tasks
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can update workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can update workspace tasks" ON public.workspace_tasks
    FOR UPDATE USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace comments" ON public.workspace_comments;
CREATE POLICY "Members can view workspace comments" ON public.workspace_comments
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace comments" ON public.workspace_comments;
CREATE POLICY "Members can insert workspace comments" ON public.workspace_comments
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace memories" ON public.workspace_memories;
CREATE POLICY "Members can view workspace memories" ON public.workspace_memories
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace memories" ON public.workspace_memories;
CREATE POLICY "Members can insert workspace memories" ON public.workspace_memories
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace activity" ON public.workspace_activity;
CREATE POLICY "Members can view workspace activity" ON public.workspace_activity
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can log workspace activity" ON public.workspace_activity;
CREATE POLICY "Members can log workspace activity" ON public.workspace_activity
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

-- <<< END: 20260925_phase13_team_collaboration_schema.sql <<<


-- >>> START: 20260925_phase3_adaptive_learning_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 3: ADAPTIVE SKILL LEARNING ENGINE & LIFE RPG PRODUCTION SCHEMA
-- ==============================================================================

-- 1. Learning Profiles
CREATE TABLE IF NOT EXISTS public.learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  why_learn TEXT NOT NULL,
  current_experience TEXT NOT NULL,
  target_goal TEXT NOT NULL,
  time_available_mins INT DEFAULT 15,
  target_date DATE,
  preferred_language TEXT DEFAULT 'Both (Hindi + English)',
  learning_preference TEXT DEFAULT 'Practical Execution',
  main_difficulty TEXT,
  current_weaknesses TEXT[] DEFAULT '{}',
  current_strengths TEXT[] DEFAULT '{}',
  baseline_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- 2. Skill Roadmaps
CREATE TABLE IF NOT EXISTS public.skill_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  title TEXT NOT NULL,
  total_modules INT DEFAULT 0,
  completed_modules INT DEFAULT 0,
  completion_percent INT DEFAULT 0,
  current_level INT DEFAULT 1,
  target_level INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skill Modules
CREATE TABLE IF NOT EXISTS public.skill_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES public.skill_roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 1,
  required_level INT DEFAULT 1,
  estimated_duration TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Skill Lessons
CREATE TABLE IF NOT EXISTS public.skill_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.skill_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  concept_summary TEXT NOT NULL,
  demonstration_example TEXT,
  framework_steps JSONB DEFAULT '[]'::jsonb,
  order_index INT DEFAULT 1,
  xp_reward INT DEFAULT 30,
  skill_xp_reward INT DEFAULT 20,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skill Exercises
CREATE TABLE IF NOT EXISTS public.skill_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.skill_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  exercise_type TEXT NOT NULL DEFAULT 'SPEAKING_OR_TEXT' CHECK (exercise_type IN ('SPEAKING_OR_TEXT', 'AUDIO_RECORD', 'TEXT_PRACTICE', 'TIMED_CHALLENGE', 'REAL_WORLD')),
  duration_seconds INT DEFAULT 60,
  xp_reward INT DEFAULT 45,
  skill_xp_reward INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Practice Attempts & Audio Assessments
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  exercise_id TEXT,
  attempt_number INT DEFAULT 1,
  transcript TEXT,
  audio_url TEXT,
  duration_seconds INT DEFAULT 0,
  self_rating INT DEFAULT 3,
  metrics JSONB DEFAULT '{
    "estimated_words": 0,
    "speaking_rate_wpm": 0,
    "pause_count": 0,
    "long_pauses": 0,
    "filler_words_count": 0,
    "repeated_words_count": 0
  }'::jsonb,
  feedback JSONB DEFAULT '{
    "clarity_feedback": "",
    "structure_feedback": "",
    "opening_feedback": "",
    "closing_feedback": "",
    "strengths": [],
    "improvements": [],
    "next_focus": "",
    "ai_analysis_status": "PENDING_OR_MANUAL"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Boss Missions
CREATE TABLE IF NOT EXISTS public.boss_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_xp INT DEFAULT 500,
  reward_skill_xp INT DEFAULT 150,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Boss Objectives
CREATE TABLE IF NOT EXISTS public.boss_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_mission_id UUID NOT NULL REFERENCES public.boss_missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Post-Action Reflections
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('QUEST', 'BOSS_MISSION', 'DAILY', 'SKILL_MILESTONE')),
  source_id TEXT,
  what_went_well TEXT NOT NULL,
  what_was_difficult TEXT,
  what_did_you_learn TEXT NOT NULL,
  what_will_you_change TEXT,
  converted_to_memory BOOLEAN DEFAULT FALSE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Reconcile XP Transactions table columns
ALTER TABLE public.xp_transactions ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS goal_id TEXT;

-- 11. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 12. Create Strict Owner-Only Policies
CREATE POLICY "learning_profiles_owner_all" ON public.learning_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_roadmaps_owner_all" ON public.skill_roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_modules_owner_all" ON public.skill_modules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_lessons_owner_all" ON public.skill_lessons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_exercises_owner_all" ON public.skill_exercises FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "practice_attempts_owner_all" ON public.practice_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "boss_missions_owner_all" ON public.boss_missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "boss_objectives_owner_all" ON public.boss_objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reflections_owner_all" ON public.reflections FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase3_adaptive_learning_schema.sql <<<


-- >>> START: 20260925_phase4_ai_core_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 4: AI CORE, CHAT, TOOLS & AGENT ORCHESTRATION SCHEMA
-- ==============================================================================

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Intelligence Session',
  channel TEXT NOT NULL DEFAULT 'WEB' CHECK (channel IN ('WEB', 'WHATSAPP', 'MOBILE', 'API')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
  content TEXT NOT NULL,
  cards JSONB DEFAULT '[]'::jsonb,
  intent TEXT,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Tool Calls Log (Permanent ledger with Idempotency)
CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING_APPROVAL', 'CANCELLED')),
  idempotency_key TEXT,
  latency_ms INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Runs (Observability & Token Metrics)
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'CHAT',
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'TIMEOUT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agent Events
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Indices for High-Speed Retrieval & Idempotency
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tool_calls_idempotency ON public.ai_tool_calls(user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_approvals_user_status ON public.approval_requests(user_id, status);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- 9. Create Strict Isolation Policies
CREATE POLICY "conversations_owner_all" ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "messages_owner_all" ON public.messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_tool_calls_owner_all" ON public.ai_tool_calls FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_runs_owner_all" ON public.ai_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_events_owner_all" ON public.agent_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "approval_requests_owner_all" ON public.approval_requests FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase4_ai_core_schema.sql <<<


-- >>> START: 20260925_phase5_connected_mentra_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 5: CONNECTED MENTRA & EXTERNAL AGENTS SCHEMA
-- ==============================================================================

-- 1. Integration Connections Table (Publicly queryable by owner)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'GOOGLE', 'WHATSAPP', etc.
  service TEXT NOT NULL,  -- 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'GOOGLE_CONTACTS', 'WHATSAPP_CLOUD_API', etc.
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ACTION_REQUIRED', 'TOKEN_EXPIRED', 'NOT_CONFIGURED', 'SANDBOX_MODE')),
  account_email TEXT,
  account_id TEXT,
  scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);

-- 2. Integration Tokens Table (STRICT SERVER-ONLY - No client select policy)
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  token_iv TEXT NOT NULL,
  token_tag TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 3. Agent Tasks & Task Queue Table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PLANNING', 'RUNNING', 'WAITING_TOOL', 'WAITING_APPROVAL', 'COMPLETE', 'PARTIAL', 'FAILED', 'CANCELLED')),
  current_stage TEXT DEFAULT 'INITIALIZING',
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Research Runs & Intelligence Reports Table
CREATE TABLE IF NOT EXISTS public.research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  objective TEXT,
  depth TEXT NOT NULL DEFAULT 'STANDARD' CHECK (depth IN ('QUICK', 'STANDARD', 'DEEP')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SEARCHING', 'ANALYZING', 'COMPLETE', 'FAILED')),
  summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. External Action Audit Trail Log
CREATE TABLE IF NOT EXISTS public.external_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  service TEXT NOT NULL, -- 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_SHEETS', etc.
  action_type TEXT NOT NULL, -- 'SEND_EMAIL', 'CREATE_CALENDAR_EVENT', 'UPDATE_SHEET', etc.
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED')),
  approval_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_integrations_user_service ON public.integrations(user_id, service);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_status ON public.agent_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_runs_user ON public.research_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ext_actions_user ON public.external_action_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ext_actions_idempotency ON public.external_action_logs(user_id, idempotency_key);

-- 7. Row Level Security (RLS)
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_action_logs ENABLE ROW LEVEL SECURITY;

-- 8. Owner Isolation Policies
CREATE POLICY "integrations_owner_all" ON public.integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "integration_tokens_owner_all" ON public.integration_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_tasks_owner_all" ON public.agent_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "research_runs_owner_all" ON public.research_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "external_action_logs_owner_all" ON public.external_action_logs FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase5_connected_mentra_schema.sql <<<


-- >>> START: 20260925_phase6_proactive_whatsapp_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 6: ALWAYS-AVAILABLE PERSONAL AI & WHATSAPP GATEWAY SCHEMA
-- ==============================================================================

-- 1. WhatsApp Connections Table (Maps phone number to MENTRA user)
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  display_phone_number TEXT,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'READY_TO_CONNECT' CHECK (status IN ('NOT_CONFIGURED', 'READY_TO_CONNECT', 'WAITING_LINK', 'CONNECTED', 'TOKEN_ERROR', 'WEBHOOK_ERROR', 'DISCONNECTED')),
  metadata JSONB DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WhatsApp Account Linking Codes (Single-use, 15-minute TTL)
CREATE TABLE IF NOT EXISTS public.whatsapp_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scheduled Jobs Engine Table (Background Cron & Proactive Jobs)
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MORNING_BRIEF', 'EVENING_REFLECTION', 'REMINDER', 'WEEKLY_REPORT', 'LEARNING_NUDGE', 'FINANCE_ALERT', 'AGENT_SCHEDULE', 'STREAK_CHECK')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  recurrence TEXT NOT NULL DEFAULT 'NONE' CHECK (recurrence IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY')),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETE', 'FAILED', 'CANCELLED', 'PAUSED')),
  deduplication_key TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Job Execution Runs (Audit log of background jobs)
CREATE TABLE IF NOT EXISTS public.job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'RETRYING')),
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Notification Preferences Table (Quiet hours, channel per category)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TEXT DEFAULT '22:30',
  quiet_hours_end TEXT DEFAULT '07:30',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  paused_until TIMESTAMPTZ,
  channels JSONB DEFAULT '{"MORNING_BRIEF": ["WHATSAPP", "WEB"], "FINANCE_ALERT": ["WHATSAPP", "WEB"], "REMINDER": ["WHATSAPP", "WEB"], "LEARNING_NUDGE": ["WHATSAPP", "WEB"], "QUEST_REMINDER": ["WEB"], "EVENING_REFLECTION": ["WHATSAPP", "WEB"], "WEEKLY_REPORT": ["WHATSAPP", "WEB"], "AGENT_COMPLETE": ["WHATSAPP", "WEB"]}'::jsonb,
  categories JSONB DEFAULT '{"QUEST": true, "GOAL": true, "LEARNING": true, "FINANCE": true, "CALENDAR": true, "EMAIL": true, "AGENT": true, "REPORT": true, "JOURNAL": true, "SYSTEM": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Daily Briefs Table (Persisted daily dossier to prevent inconsistent regeneration)
CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  content TEXT NOT NULL,
  priorities JSONB DEFAULT '[]'::jsonb,
  delivery_channels TEXT[] DEFAULT '{"WEB"}'::text[],
  delivery_status JSONB DEFAULT '{"WEB": "DELIVERED"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. Inbound & Outbound WhatsApp Messaging Ledger (Delivery tracking & idempotency)
CREATE TABLE IF NOT EXISTS public.inbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  provider_message_id TEXT NOT NULL UNIQUE,
  sender_phone TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  text TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSED', 'FAILED', 'IGNORED', 'DUPLICATE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  recipient TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'TEMPLATE', 'INTERACTIVE', 'AUDIO')),
  content TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes for Instant Retrieval & Idempotency
CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_user ON public.whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_phone ON public.whatsapp_connections(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_code ON public.whatsapp_link_codes(code) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON public.scheduled_jobs(status, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_jobs_dedup ON public.scheduled_jobs(user_id, deduplication_key);
CREATE INDEX IF NOT EXISTS idx_daily_briefs_user_date ON public.daily_briefs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_inbound_provider_msg ON public.inbound_messages(provider_message_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

-- 10. Owner Isolation Policies
CREATE POLICY "whatsapp_connections_owner_all" ON public.whatsapp_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "whatsapp_link_codes_owner_all" ON public.whatsapp_link_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scheduled_jobs_owner_all" ON public.scheduled_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "job_runs_owner_all" ON public.job_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notification_preferences_owner_all" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "daily_briefs_owner_all" ON public.daily_briefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "inbound_messages_owner_all" ON public.inbound_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "outbound_messages_owner_all" ON public.outbound_messages FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase6_proactive_whatsapp_schema.sql <<<


-- >>> START: 20260925_phase7_voice_missions_autonomy_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 7: VOICE-FIRST, MISSION PLANNER, FOCUS & AUTONOMY SCHEMA
-- ==============================================================================

-- 1. Voice Sessions & Transcripts
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'IDLE' NOT NULL, -- 'IDLE' | 'LISTENING' | 'TRANSCRIBING' | 'THINKING' | 'SPEAKING' | 'COMPLETE' | 'ERROR'
  mode VARCHAR(50) DEFAULT 'CONVERSATIONAL' NOT NULL, -- 'CONVERSATIONAL' | 'PUBLIC_SPEAKING' | 'JOURNAL' | 'FOCUS'
  transcript TEXT,
  response_text TEXT,
  duration_seconds NUMERIC(8,2) DEFAULT 0,
  analysis_metrics JSONB DEFAULT '{}'::jsonb,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Public Speaking Voice Practices
CREATE TABLE IF NOT EXISTS public.voice_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id VARCHAR(100) DEFAULT 'public_speaking' NOT NULL,
  topic TEXT NOT NULL,
  transcript TEXT NOT NULL,
  audio_metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- { duration, wpm, fillerCount, pauseCount, clarityScore }
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,      -- { strengths, improvements, nextFocus, score }
  xp_awarded INTEGER DEFAULT 25 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Sovereign Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  timeline_days INTEGER DEFAULT 7 NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  milestones JSONB DEFAULT '[]'::jsonb NOT NULL,
  total_xp INTEGER DEFAULT 200 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Autonomous Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  goal TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'READY' NOT NULL, -- 'DRAFT' | 'READY' | 'RUNNING' | 'WAITING_APPROVAL' | 'PAUSED' | 'COMPLETE' | 'FAILED' | 'CANCELLED'
  priority VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL, -- 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  risk_level VARCHAR(30) DEFAULT 'LOW_RISK_INTERNAL' NOT NULL,
  autonomy_mode VARCHAR(30) DEFAULT 'ASSISTED' NOT NULL, -- 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Plan Steps & Task Graph
CREATE TABLE IF NOT EXISTS public.plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_index INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'RESEARCH' | 'ANALYZE' | 'CREATE_QUEST' | 'CALENDAR_PROPOSAL' | 'FINANCE_CHECK' | 'EXTERNAL_DRAFT' | 'BROWSER_ACTION'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  agent VARCHAR(100),
  tool VARCHAR(100),
  dependencies TEXT[] DEFAULT '{}'::text[],
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETE' | 'FAILED' | 'SKIPPED'
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Focus Sessions
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  planned_duration_min INTEGER DEFAULT 45 NOT NULL,
  actual_duration_min NUMERIC(6,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'RUNNING' NOT NULL, -- 'RUNNING' | 'COMPLETED' | 'CANCELLED'
  reflections TEXT,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 7. Controlled Browser Sessions & Actions
CREATE TABLE IF NOT EXISTS public.browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  current_url TEXT,
  provider VARCHAR(50) DEFAULT 'CONTROLLED_BROWSER_GATEWAY',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.browser_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.browser_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'NAVIGATE' | 'READ_PAGE' | 'CLICK' | 'TYPE' | 'SCREENSHOT' | 'SUBMIT'
  target_url TEXT NOT NULL,
  selector TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  risk_level VARCHAR(30) DEFAULT 'LOW_RISK_INTERNAL' NOT NULL, -- 'READ_ONLY' | 'LOW_RISK_INTERNAL' | 'LOW_RISK_EXTERNAL' | 'SENSITIVE' | 'DESTRUCTIVE' | 'FINANCIAL' | 'SECURITY'
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  screenshot_url TEXT,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Execution Audits
CREATE TABLE IF NOT EXISTS public.execution_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type VARCHAR(50) NOT NULL, -- 'PLAN' | 'MISSION' | 'BROWSER' | 'VOICE' | 'AGENT'
  context_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  action_name VARCHAR(100) NOT NULL,
  risk_level VARCHAR(30) NOT NULL,
  approved_by VARCHAR(50) DEFAULT 'SYSTEM', -- 'USER' | 'SYSTEM' | 'AUTO_INTERNAL'
  status VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Autonomy Settings
CREATE TABLE IF NOT EXISTS public.autonomy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(30) DEFAULT 'ASSISTED' NOT NULL, -- 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL'
  max_planning_steps INTEGER DEFAULT 8 NOT NULL,
  max_tool_calls INTEGER DEFAULT 12 NOT NULL,
  max_browser_actions INTEGER DEFAULT 5 NOT NULL,
  trusted_internal_actions BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Voice Settings
CREATE TABLE IF NOT EXISTS public.voice_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tts_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  voice_id VARCHAR(100) DEFAULT 'echo' NOT NULL,
  speech_speed NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  language VARCHAR(20) DEFAULT 'hi-IN' NOT NULL,
  auto_speak_responses BOOLEAN DEFAULT TRUE NOT NULL,
  audio_retention_days INTEGER DEFAULT 30 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Owner isolation)
CREATE POLICY "Users access own voice_sessions" ON public.voice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own voice_practices" ON public.voice_practices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own missions" ON public.missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plan_steps" ON public.plan_steps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own focus_sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own browser_sessions" ON public.browser_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own browser_actions" ON public.browser_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own execution_audits" ON public.execution_audits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own autonomy_settings" ON public.autonomy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own voice_settings" ON public.voice_settings FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase7_voice_missions_autonomy_schema.sql <<<


-- >>> START: 20260925_phase8_knowledge_habits_projects_schema.sql >>>
-- ==============================================================================
-- MENTRA PHASE 8: PERSONAL KNOWLEDGE GRAPH, HABITS, ROUTINES & PROJECTS SCHEMA
-- ==============================================================================

-- 1. Knowledge Graph Entities & Edges
CREATE TABLE IF NOT EXISTS public.knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'PERSON' | 'PROJECT' | 'BUSINESS' | 'GOAL' | 'SKILL' | 'QUEST' | 'HABIT' | 'ROUTINE' | 'DECISION' | 'TOPIC' | 'MEMORY'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  provenance_type VARCHAR(50) DEFAULT 'USER_EXPLICIT' NOT NULL, -- 'FACT' | 'USER_PREFERENCE' | 'USER_DECISION' | 'AI_INFERENCE' | 'SYSTEM_CALCULATION'
  source VARCHAR(100) DEFAULT 'USER_EXPLICIT' NOT NULL, -- 'USER_EXPLICIT' | 'JOURNAL' | 'CONVERSATION' | 'QUEST' | 'GOAL' | 'AGENT_RESEARCH' | 'FINANCE' | 'LEARNING'
  confidence NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  verified_by_user BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES public.knowledge_entities(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.knowledge_entities(id) ON DELETE CASCADE NOT NULL,
  relation_type VARCHAR(50) NOT NULL, -- 'OWNS' | 'WORKS_ON' | 'RELATED_TO' | 'DEPENDS_ON' | 'SUPPORTS' | 'REQUIRES_SKILL' | 'HAS_QUEST' | 'MENTIONED_IN'
  confidence NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Projects & Strategic Decision Ledger
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objective TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'PAUSED' | 'COMPLETE'
  health VARCHAR(50) DEFAULT 'ON_TRACK' NOT NULL,
  priority VARCHAR(20) DEFAULT 'HIGH' NOT NULL,
  target_date DATE,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  collaborators JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ name, role, email, context }]
  finance_budget NUMERIC(12,2) DEFAULT 0,
  finance_spent NUMERIC(12,2) DEFAULT 0,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  rationale TEXT NOT NULL,
  alternatives TEXT[] DEFAULT '{}'::text[],
  expected_outcome TEXT,
  actual_outcome TEXT,
  status VARCHAR(50) DEFAULT 'DECIDED' NOT NULL, -- 'DECIDED' | 'EVALUATED' | 'REVISED'
  source VARCHAR(50) DEFAULT 'OPERATOR' NOT NULL,
  decided_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Habits & Deterministic Completion Tracking
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  life_area VARCHAR(50) DEFAULT 'Personal Growth' NOT NULL, -- 'Business' | 'Finance' | 'Learning' | 'Health & Fitness' | 'Personal Growth' | 'Creativity'
  frequency VARCHAR(50) DEFAULT 'DAILY' NOT NULL, -- 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'CUSTOM'
  target_count INTEGER DEFAULT 1 NOT NULL,
  preferred_time VARCHAR(20) DEFAULT 'MORNING', -- 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME'
  difficulty VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  related_skill_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
  xp_reward INTEGER DEFAULT 15 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  source VARCHAR(50) DEFAULT 'WEB' NOT NULL,
  xp_awarded INTEGER DEFAULT 15 NOT NULL,
  CONSTRAINT unique_habit_daily_completion UNIQUE (habit_id, completion_date)
);

-- 4. Routines & Runs
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  routine_type VARCHAR(50) DEFAULT 'MORNING' NOT NULL, -- 'MORNING' | 'NIGHT' | 'DEEP_WORK' | 'WEEKEND' | 'CUSTOM'
  duration_minutes INTEGER DEFAULT 30 NOT NULL,
  steps JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ step_index, title, duration_min, action_type, ref_id }]
  trigger_time VARCHAR(10), -- e.g. "07:30"
  days TEXT[] DEFAULT '{"MON","TUE","WED","THU","FRI","SAT","SUN"}'::text[],
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.routine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  run_date DATE NOT NULL,
  completed_steps INTEGER DEFAULT 0 NOT NULL,
  total_steps INTEGER NOT NULL,
  duration_minutes NUMERIC(6,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'COMPLETED' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Behavioral Patterns & Recommendations
CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- 'TIME_PREFERENCE' | 'TASK_DURATION' | 'LEARNING_WINDOW' | 'ROUTINE_COMPLETION' | 'NOTIFICATION_INTERACTION'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.7 NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb NOT NULL,
  last_observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'NEXT_QUEST' | 'LEARNING_NUDGE' | 'ROUTINE_ADJUST' | 'FINANCE_REVIEW' | 'PROJECT_ACTION' | 'GOAL_CHECK'
  title VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8 NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  status VARCHAR(50) DEFAULT 'NEW' NOT NULL, -- 'NEW' | 'VIEWED' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'ACCEPTED' | 'DISMISSED' | 'HELPFUL' | 'NOT_HELPFUL'
  feedback_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Privacy-Gated Wellness Tracking
CREATE TABLE IF NOT EXISTS public.wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  sleep_hours NUMERIC(4,2),
  energy_rating VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW' | 'NORMAL' | 'HIGH'
  mood_rating VARCHAR(20) DEFAULT 'GOOD', -- 'LOW' | 'NEUTRAL' | 'GOOD' | 'EXCELLENT'
  workout_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wellness_daily_entry UNIQUE (user_id, entry_date)
);

-- 7. Personalization & Privacy Configuration
CREATE TABLE IF NOT EXISTS public.personalization_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level VARCHAR(30) DEFAULT 'STANDARD' NOT NULL, -- 'MINIMAL' | 'STANDARD' | 'DEEP'
  use_calendar_patterns BOOLEAN DEFAULT TRUE NOT NULL,
  use_learning_patterns BOOLEAN DEFAULT TRUE NOT NULL,
  use_finance_context BOOLEAN DEFAULT TRUE NOT NULL,
  use_wellness_context BOOLEAN DEFAULT FALSE NOT NULL,
  auto_memory_candidates BOOLEAN DEFAULT TRUE NOT NULL,
  recommendation_frequency VARCHAR(20) DEFAULT 'NORMAL' NOT NULL, -- 'LOW' | 'NORMAL' | 'HIGH'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_settings ENABLE ROW LEVEL SECURITY;

-- Owner Isolation Policies
CREATE POLICY "Users access own knowledge_entities" ON public.knowledge_entities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own knowledge_edges" ON public.knowledge_edges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own decisions" ON public.decisions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habit_completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own routines" ON public.routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own routine_runs" ON public.routine_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own user_patterns" ON public.user_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recommendations" ON public.recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recommendation_feedback" ON public.recommendation_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own wellness_entries" ON public.wellness_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own personalization_settings" ON public.personalization_settings FOR ALL USING (auth.uid() = user_id);

-- <<< END: 20260925_phase8_knowledge_habits_projects_schema.sql <<<


-- >>> START: 20260925_phase9_production_hardening.sql >>>
-- ==============================================================================
-- MENTRA PHASE 9: PRODUCTION HARDENING, RLS MASTER AUDIT & IDEMPOTENCY MIGRATION
-- ==============================================================================

-- 1. Create Audit Logs table for security and governance traceability
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    target_resource TEXT,
    payload_hash TEXT,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'BLOCKED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service and users can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 2. Performance and Idempotency Indexes

-- Habit single-completion per day constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_unique_daily 
    ON public.habit_completions (habit_id, completion_date);

-- Project decisions indexing
CREATE INDEX IF NOT EXISTS idx_decisions_project_user 
    ON public.decisions (project_id, user_id, date);

-- Wellness telemetry user date index
CREATE INDEX IF NOT EXISTS idx_wellness_user_date 
    ON public.wellness_entries (user_id, entry_date);

-- Knowledge entities and edges user indexing
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_type 
    ON public.knowledge_entities (user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_user_relation 
    ON public.knowledge_edges (user_id, relation);

-- Recommendations status and expiry index
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status 
    ON public.recommendations (user_id, status, expires_at);

-- Action approvals pending lookup index
CREATE INDEX IF NOT EXISTS idx_approvals_user_status_expires 
    ON public.action_approvals (user_id, status, expires_at);

-- 3. Comprehensive RLS check function
CREATE OR REPLACE FUNCTION public.check_phase9_rls_compliance()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT AS table_name,
        c.relrowsecurity::BOOLEAN AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY c.relname;
END;
$$;

-- <<< END: 20260925_phase9_production_hardening.sql <<<


-- >>> START: 20260926_p0_scheduler_contract_repair.sql >>>
-- ==============================================================================
-- MENTRA P0: Scheduler + notification contract repair
-- Date: 2026-09-26
-- Purpose:
--   Align notification_preferences with the application service contract.
--   Scheduler/job_runs/daily_briefs remain on the canonical Phase-6 column names.
-- ==============================================================================

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS morning_brief_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS morning_brief_time TEXT NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS evening_reflection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS evening_reflection_time TEXT NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quest_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS goal_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS learning_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS finance_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS calendar_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS gmail_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS agent_updates BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT NOT NULL DEFAULT 'WHATSAPP';

-- Backfill explicit toggles from the Phase-6 JSON category map where available.
UPDATE public.notification_preferences
SET
  quest_alerts = COALESCE((categories->>'QUEST')::boolean, quest_alerts),
  goal_alerts = COALESCE((categories->>'GOAL')::boolean, goal_alerts),
  learning_reminders = COALESCE((categories->>'LEARNING')::boolean, learning_reminders),
  finance_alerts = COALESCE((categories->>'FINANCE')::boolean, finance_alerts),
  calendar_alerts = COALESCE((categories->>'CALENDAR')::boolean, calendar_alerts),
  gmail_alerts = COALESCE((categories->>'EMAIL')::boolean, gmail_alerts),
  agent_updates = COALESCE((categories->>'AGENT')::boolean, agent_updates),
  weekly_report = COALESCE((categories->>'REPORT')::boolean, weekly_report);

-- Keep preferred_channel conservative: use WhatsApp only when the Phase-6 map
-- explicitly lists it for reminders; otherwise default to WEB.
UPDATE public.notification_preferences
SET preferred_channel = CASE
  WHEN COALESCE(channels->'REMINDER', '[]'::jsonb) ? 'WHATSAPP' THEN 'WHATSAPP'
  ELSE 'WEB'
END;

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_due
  ON public.scheduled_jobs(status, scheduled_for ASC)
  WHERE status = 'SCHEDULED';


-- AI tool-call states used by the legacy core and Agent Runtime V2.
ALTER TABLE public.ai_tool_calls
  DROP CONSTRAINT IF EXISTS ai_tool_calls_status_check;

ALTER TABLE public.ai_tool_calls
  ADD CONSTRAINT ai_tool_calls_status_check
  CHECK (status IN (
    'SUCCESS',
    'FAILED',
    'PENDING_APPROVAL',
    'APPROVAL_REQUIRED',
    'VALIDATION_FAILED',
    'LOOP_BLOCKED',
    'CANCELLED'
  ));

-- <<< END: 20260926_p0_scheduler_contract_repair.sql <<<


-- >>> START: 20260926_phase14_jarvis_core_foundation.sql >>>
-- ==============================================================================
-- MENTRA PHASE 14: JARVIS CORE FOUNDATION
-- Memory V2 (hybrid retrieval) + persistent agent checkpoints
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 1. Memory V2
-- ------------------------------------------------------------------------------

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(768),
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS search_document tsvector
    GENERATED ALWAYS AS (
      to_tsvector(
        'simple',
        coalesce(title, '') || ' ' || coalesce(content, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_memories_search_document
  ON public.memories USING gin(search_document);

CREATE INDEX IF NOT EXISTS idx_memories_embedding_hnsw
  ON public.memories USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_memories_user_created
  ON public.memories(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.search_memories_hybrid(
  p_query_text TEXT,
  p_query_embedding extensions.vector(768),
  p_match_count INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  source TEXT,
  source_id TEXT,
  importance TEXT,
  tags JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rrf_score DOUBLE PRECISION,
  semantic_rank BIGINT,
  keyword_rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH keyword_matches AS (
    SELECT
      m.id,
      row_number() OVER (
        ORDER BY ts_rank_cd(
          m.search_document,
          websearch_to_tsquery('simple', p_query_text)
        ) DESC
      ) AS keyword_rank
    FROM public.memories m
    WHERE m.user_id = (SELECT auth.uid())
      AND nullif(trim(p_query_text), '') IS NOT NULL
      AND m.search_document @@ websearch_to_tsquery('simple', p_query_text)
    ORDER BY ts_rank_cd(
      m.search_document,
      websearch_to_tsquery('simple', p_query_text)
    ) DESC
    LIMIT LEAST(GREATEST(p_match_count * 8, 20), 100)
  ),
  semantic_matches AS (
    SELECT
      m.id,
      row_number() OVER (
        ORDER BY m.embedding <=> p_query_embedding
      ) AS semantic_rank
    FROM public.memories m
    WHERE m.user_id = (SELECT auth.uid())
      AND p_query_embedding IS NOT NULL
      AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> p_query_embedding
    LIMIT LEAST(GREATEST(p_match_count * 8, 20), 100)
  ),
  fused AS (
    SELECT
      coalesce(k.id, s.id) AS id,
      k.keyword_rank,
      s.semantic_rank,
      coalesce(1.0 / (60.0 + k.keyword_rank), 0.0) +
      coalesce(1.0 / (60.0 + s.semantic_rank), 0.0) AS base_rrf_score
    FROM keyword_matches k
    FULL OUTER JOIN semantic_matches s ON s.id = k.id
  )
  SELECT
    m.id,
    m.user_id,
    m.type,
    m.title,
    m.content,
    m.source,
    m.source_id,
    m.importance,
    m.tags,
    m.metadata,
    m.created_at,
    m.updated_at,
    (
      f.base_rrf_score +
      CASE m.importance
        WHEN 'HIGH' THEN 0.004
        WHEN 'MEDIUM' THEN 0.002
        ELSE 0.0
      END
    )::DOUBLE PRECISION AS rrf_score,
    f.semantic_rank,
    f.keyword_rank
  FROM fused f
  JOIN public.memories m ON m.id = f.id
  ORDER BY rrf_score DESC, m.created_at DESC
  LIMIT LEAST(GREATEST(p_match_count, 1), 50);
$$;

REVOKE ALL ON FUNCTION public.search_memories_hybrid(TEXT, extensions.vector, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_memories_hybrid(TEXT, extensions.vector, INTEGER)
  TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Persistent agent checkpoints
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_runtime_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'WAITING_APPROVAL', 'PAUSED', 'COMPLETE', 'FAILED')),
  checkpoint JSONB NOT NULL DEFAULT '{}'::jsonb,
  step_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_run_at TIMESTAMPTZ,
  checkpointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, agent_key)
);

ALTER TABLE public.agent_runtime_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_runtime_state_owner_all" ON public.agent_runtime_state;
CREATE POLICY "agent_runtime_state_owner_all"
  ON public.agent_runtime_state
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_runtime_state TO authenticated;

CREATE INDEX IF NOT EXISTS idx_agent_runtime_state_user_status
  ON public.agent_runtime_state(user_id, status, checkpointed_at DESC);

-- <<< END: 20260926_phase14_jarvis_core_foundation.sql <<<


-- >>> START: 20260926_phase15a_operative_monitors.sql >>>
-- ==============================================================================
-- MENTRA PHASE 15A: OPERATIVE MONITORS
-- ==============================================================================

ALTER TABLE public.scheduled_jobs
  DROP CONSTRAINT IF EXISTS scheduled_jobs_recurrence_check;

ALTER TABLE public.scheduled_jobs
  ADD CONSTRAINT scheduled_jobs_recurrence_check
  CHECK (recurrence IN ('NONE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'));

CREATE INDEX IF NOT EXISTS idx_scheduled_agent_jobs
  ON public.scheduled_jobs(user_id, status, scheduled_for)
  WHERE type = 'AGENT_SCHEDULE';

-- <<< END: 20260926_phase15a_operative_monitors.sql <<<


-- >>> START: 20260926_phase15b_brain_worker_whatsapp_qr.sql >>>
-- ==============================================================================
-- MENTRA PHASE 15B: PERSISTENT BRAIN WORKER + WHATSAPP QR SESSION STATE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.brain_worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ONLINE',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brain_worker_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brain_worker_heartbeats_owner_read"
  ON public.brain_worker_heartbeats;
CREATE POLICY "brain_worker_heartbeats_owner_read"
  ON public.brain_worker_heartbeats
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.brain_worker_heartbeats TO authenticated;

CREATE TABLE IF NOT EXISTS public.whatsapp_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL DEFAULT 'brain-worker',
  status TEXT NOT NULL DEFAULT 'DISCONNECTED'
    CHECK (status IN ('WAITING_QR', 'QR_READY', 'CONNECTED', 'DISCONNECTED', 'ERROR')),
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  connected_number TEXT,
  connected_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_qr_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_qr_sessions_owner_read"
  ON public.whatsapp_qr_sessions;
CREATE POLICY "whatsapp_qr_sessions_owner_read"
  ON public.whatsapp_qr_sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.whatsapp_qr_sessions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_sessions_status
  ON public.whatsapp_qr_sessions(status, updated_at DESC);

-- <<< END: 20260926_phase15b_brain_worker_whatsapp_qr.sql <<<


-- >>> START: 20260926_phase15c_approval_execution.sql >>>
-- ==============================================================================
-- MENTRA PHASE 15C: DURABLE APPROVAL EXECUTION
-- ==============================================================================

ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS result JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

ALTER TABLE public.approval_requests
  DROP CONSTRAINT IF EXISTS approval_requests_status_check;

ALTER TABLE public.approval_requests
  ADD CONSTRAINT approval_requests_status_check
  CHECK (status IN (
    'PENDING',
    'EXECUTING',
    'APPROVED',
    'REJECTED',
    'FAILED',
    'EXPIRED'
  ));

CREATE INDEX IF NOT EXISTS idx_approval_requests_pending_expiry
  ON public.approval_requests(user_id, expires_at)
  WHERE status = 'PENDING';

-- <<< END: 20260926_phase15c_approval_execution.sql <<<


-- >>> START: 20260926_phase16a_dynamic_skills.sql >>>
-- ==============================================================================
-- MENTRA PHASE 16A: USER-DEFINED REUSABLE SKILLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mentra_custom_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'PERSONAL_OS'
    CHECK (category IN ('PERSONAL_OS', 'BUSINESS', 'RESEARCH', 'PRODUCTIVITY', 'LEARNING')),
  required_tools TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'USER_CREATED'
    CHECK (source IN ('USER_CREATED', 'SYSTEM_IMPORTED')),
  trust_level TEXT NOT NULL DEFAULT 'USER'
    CHECK (trust_level IN ('USER', 'SYSTEM')),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.mentra_custom_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentra_custom_skills_owner_all"
  ON public.mentra_custom_skills;

CREATE POLICY "mentra_custom_skills_owner_all"
  ON public.mentra_custom_skills
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.mentra_custom_skills
  TO authenticated;

CREATE INDEX IF NOT EXISTS idx_mentra_custom_skills_user_enabled
  ON public.mentra_custom_skills(user_id, is_enabled, updated_at DESC);

-- <<< END: 20260926_phase16a_dynamic_skills.sql <<<


-- >>> START: 20260926_phase16b_memory_extraction_dedup.sql >>>
-- ==============================================================================
-- MENTRA PHASE 16B: MEMORY EXTRACTION + DEDUPLICATION
-- ==============================================================================

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_user_content_hash
  ON public.memories(user_id, content_hash)
  WHERE content_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.memory_extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  source_hash TEXT NOT NULL,
  extracted_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SUCCESS'
    CHECK (status IN ('SUCCESS', 'SKIPPED', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_hash)
);

ALTER TABLE public.memory_extraction_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_extraction_runs_owner_read"
  ON public.memory_extraction_runs;

CREATE POLICY "memory_extraction_runs_owner_read"
  ON public.memory_extraction_runs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.memory_extraction_runs TO authenticated;

CREATE INDEX IF NOT EXISTS idx_memory_extraction_runs_user_created
  ON public.memory_extraction_runs(user_id, created_at DESC);

-- <<< END: 20260926_phase16b_memory_extraction_dedup.sql <<<


-- >>> START: 20260926_phase16c_trace_learning.sql >>>
-- ==============================================================================
-- MENTRA PHASE 16C: TRACE LEARNING + SELF EVALUATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_run_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_run_id UUID NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  quality_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  tool_success_rate NUMERIC(5,4) NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  max_steps_reached BOOLEAN NOT NULL DEFAULT FALSE,
  approval_wait BOOLEAN NOT NULL DEFAULT FALSE,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ai_run_id)
);

ALTER TABLE public.ai_run_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_run_evaluations_owner_read"
  ON public.ai_run_evaluations;

CREATE POLICY "ai_run_evaluations_owner_read"
  ON public.ai_run_evaluations
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.ai_run_evaluations TO authenticated;

CREATE INDEX IF NOT EXISTS idx_ai_run_evaluations_user_created
  ON public.ai_run_evaluations(user_id, created_at DESC);

-- <<< END: 20260926_phase16c_trace_learning.sql <<<


-- >>> START: 20260926_phase17_system_health_recovery.sql >>>
-- ==============================================================================
-- MENTRA PHASE 17: SYSTEM HEALTH + AUTOMATIC RECOVERY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_recovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  status TEXT NOT NULL DEFAULT 'RECOVERED'
    CHECK (status IN ('RECOVERED', 'FAILED', 'SKIPPED')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_recovery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_recovery_events_owner_read"
  ON public.system_recovery_events;

CREATE POLICY "system_recovery_events_owner_read"
  ON public.system_recovery_events
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.system_recovery_events TO authenticated;

CREATE INDEX IF NOT EXISTS idx_system_recovery_events_user_created
  ON public.system_recovery_events(user_id, created_at DESC);

-- <<< END: 20260926_phase17_system_health_recovery.sql <<<


-- >>> START: 20261001_google_token_envelopes.sql >>>
-- Access and refresh tokens have independent AES-GCM authentication data.
ALTER TABLE public.integration_tokens
  ADD COLUMN IF NOT EXISTS refresh_token_iv text,
  ADD COLUMN IF NOT EXISTS refresh_token_tag text;
-- Legacy refresh ciphertext cannot be recovered without its original IV/tag.
-- Reconnecting Google replaces it with a complete authenticated envelope.

-- <<< END: 20261001_google_token_envelopes.sql <<<

