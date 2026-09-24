-- MENTRA Personal AI Operating System & Life RPG
-- Database Schema for Supabase / PostgreSQL

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User & Player Profile Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  codename TEXT NOT NULL,
  title TEXT DEFAULT 'Vanguard Architect',
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  next_level_xp INT DEFAULT 1000,
  streak_days INT DEFAULT 0,
  total_quests_completed INT DEFAULT 0,
  rank TEXT DEFAULT 'NOVICE',
  stats JSONB DEFAULT '{"focus": 50, "discipline": 50, "knowledge": 50, "business": 50, "finance": 50, "communication": 50, "fitness": 50}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quests Table
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- BUSINESS, FINANCE, FITNESS, LEARNING, PERSONAL_GROWTH
  type TEXT NOT NULL, -- DAILY, MAIN, SIDE, BOSS
  difficulty TEXT NOT NULL, -- EASY, MEDIUM, HARD, EPIC
  reward_xp INT NOT NULL DEFAULT 50,
  reward_coins INT NOT NULL DEFAULT 20,
  skill_xp_category TEXT,
  skill_xp_amount INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED, LOCKED
  progress_percent INT DEFAULT 0,
  deadline TIMESTAMPTZ,
  required_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Goals & Milestones Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percent INT DEFAULT 0,
  status TEXT DEFAULT 'IN_PROGRESS',
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skills Table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- BUSINESS, AI, FINANCE, PERSONAL
  level INT DEFAULT 1,
  max_level INT DEFAULT 10,
  current_xp INT DEFAULT 0,
  next_level_xp INT DEFAULT 500,
  unlocked BOOLEAN DEFAULT TRUE,
  prerequisites TEXT[] DEFAULT '{}',
  description TEXT,
  practice_quests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Finance Transactions & Ledgers
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL, -- INCOME, EXPENSE
  category TEXT NOT NULL, -- BUSINESS_ADS, INVENTORY, LOGISTICS, SOFTWARE, LIVING, INVESTMENT, OTHER
  scope TEXT NOT NULL, -- BUSINESS, PERSONAL
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Memory Vault Table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- DECISION, IDEA, PROJECT, PEOPLE, GOAL, JOURNAL_INSIGHT, USER_PREFERENCE
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  importance TEXT DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536), -- Ready for pgvector semantic search
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Journal Reflections Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  raw_content TEXT NOT NULL,
  summary TEXT,
  wins TEXT[] DEFAULT '{}',
  problems TEXT[] DEFAULT '{}',
  decisions TEXT[] DEFAULT '{}',
  lessons TEXT[] DEFAULT '{}',
  tomorrow_actions TEXT[] DEFAULT '{}',
  mood TEXT DEFAULT 'PRODUCTIVE',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Agents & Operational Log
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 10. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- 11. Scoped User Policies
CREATE POLICY "Users can only access their own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own quests" ON quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own skills" ON skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own finance" ON finance_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own memories" ON memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own agent runs" ON agent_runs FOR ALL USING (auth.uid() = user_id);
