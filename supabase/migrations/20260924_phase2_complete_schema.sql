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
