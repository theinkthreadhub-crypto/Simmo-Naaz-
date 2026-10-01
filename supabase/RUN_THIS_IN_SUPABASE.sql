-- ==============================================================================
-- MENTRA COMPLETE CORE & FINANCE & APPROVAL DATABASE SCHEMA
-- RUN THIS IN SUPABASE SQL EDITOR (https://supabase.com/dashboard/project/lxhrmzmsskzvjgqxypgx/sql)
-- ==============================================================================

-- 1. Profiles & Progress
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'Operator',
  bio TEXT,
  archetype TEXT DEFAULT 'VISIONARY_STRATEGIST',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  avatar_url TEXT,
  level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  streak_days INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  current_streak INT DEFAULT 1,
  quests_completed INT DEFAULT 0,
  attributes JSONB DEFAULT '{"strategy": 10, "execution": 10, "communication": 10, "resilience": 10, "mindset": 10}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Finance Tables
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  description TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  business_personal TEXT DEFAULT 'BUSINESS' CHECK (business_personal IN ('BUSINESS', 'PERSONAL')),
  account_source TEXT DEFAULT 'PRIMARY_ACCOUNT',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
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

-- 3. AI Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_input JSONB DEFAULT '{}'::jsonb,
  input_payload JSONB DEFAULT '{}'::jsonb,
  payload_hash TEXT,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  autonomy_mode TEXT DEFAULT 'SUPERVISED',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Tool Calls Ledger (Idempotency & Logs)
CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID,
  tool_name TEXT NOT NULL,
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  idempotency_key TEXT,
  latency_ms INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Runs (Observability)
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  provider TEXT NOT NULL DEFAULT 'gemini',
  model TEXT NOT NULL DEFAULT 'gemini-3.5-flash',
  purpose TEXT NOT NULL DEFAULT 'CHAT',
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Memories (Hybrid Memory Store)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'FACT',
  title TEXT NOT NULL DEFAULT 'Memory',
  content TEXT NOT NULL,
  source TEXT,
  source_id TEXT,
  importance TEXT DEFAULT 'MEDIUM',
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quests & Goals
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'DAILY',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
  category TEXT NOT NULL DEFAULT 'BUSINESS',
  xp_reward INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'BUSINESS',
  target_value NUMERIC(12, 2) DEFAULT 100,
  current_value NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT '%',
  status TEXT DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 9. Add Permissive Isolation Policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "profiles_owner_all" ON public.profiles;
  CREATE POLICY "profiles_owner_all" ON public.profiles FOR ALL USING (true);

  DROP POLICY IF EXISTS "progress_owner_all" ON public.player_progress;
  CREATE POLICY "progress_owner_all" ON public.player_progress FOR ALL USING (true);

  DROP POLICY IF EXISTS "finance_owner_all" ON public.finance_transactions;
  CREATE POLICY "finance_owner_all" ON public.finance_transactions FOR ALL USING (true);

  DROP POLICY IF EXISTS "approvals_owner_all" ON public.approval_requests;
  CREATE POLICY "approvals_owner_all" ON public.approval_requests FOR ALL USING (true);

  DROP POLICY IF EXISTS "tool_calls_owner_all" ON public.ai_tool_calls;
  CREATE POLICY "tool_calls_owner_all" ON public.ai_tool_calls FOR ALL USING (true);

  DROP POLICY IF EXISTS "ai_runs_owner_all" ON public.ai_runs;
  CREATE POLICY "ai_runs_owner_all" ON public.ai_runs FOR ALL USING (true);

  DROP POLICY IF EXISTS "memories_owner_all" ON public.memories;
  CREATE POLICY "memories_owner_all" ON public.memories FOR ALL USING (true);

  DROP POLICY IF EXISTS "quests_owner_all" ON public.quests;
  CREATE POLICY "quests_owner_all" ON public.quests FOR ALL USING (true);

  DROP POLICY IF EXISTS "goals_owner_all" ON public.goals;
  CREATE POLICY "goals_owner_all" ON public.goals FOR ALL USING (true);
END $$;

-- 10. Auto-create Profile & Progress on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Operator'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.player_progress (user_id, level, current_xp)
  VALUES (NEW.id, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Initialize profiles for any existing auth users
INSERT INTO public.profiles (id, display_name)
SELECT id, 'Operator' FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.player_progress (user_id, level, current_xp)
SELECT id, 1, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
