-- ==============================================================================
-- MENTRA: FIX ALL FOREIGN KEY CONSTRAINTS & PERMISSIONS
-- Run this in Supabase SQL Editor to eliminate any foreign key constraint blocks
-- ==============================================================================

-- 1. Drop foreign key constraints that block internal worker / tool inserts
ALTER TABLE IF EXISTS public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_user_id_fkey;
ALTER TABLE IF EXISTS public.finance_transactions DROP CONSTRAINT IF EXISTS finance_transactions_user_id_fkey;
ALTER TABLE IF EXISTS public.ai_tool_calls DROP CONSTRAINT IF EXISTS ai_tool_calls_user_id_fkey;
ALTER TABLE IF EXISTS public.ai_runs DROP CONSTRAINT IF EXISTS ai_runs_user_id_fkey;
ALTER TABLE IF EXISTS public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE IF EXISTS public.player_progress DROP CONSTRAINT IF EXISTS player_progress_user_id_fkey;
ALTER TABLE IF EXISTS public.memories DROP CONSTRAINT IF EXISTS memories_user_id_fkey;
ALTER TABLE IF EXISTS public.goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE IF EXISTS public.quests DROP CONSTRAINT IF EXISTS quests_user_id_fkey;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS public.user_skills DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey;
ALTER TABLE IF EXISTS public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_fkey;

-- 2. Ensure RLS policies allow operations for authenticated & service role
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "approvals_all" ON public.approval_requests;
  CREATE POLICY "approvals_all" ON public.approval_requests FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "finance_all" ON public.finance_transactions;
  CREATE POLICY "finance_all" ON public.finance_transactions FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "tool_calls_all" ON public.ai_tool_calls;
  CREATE POLICY "tool_calls_all" ON public.ai_tool_calls FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "ai_runs_all" ON public.ai_runs;
  CREATE POLICY "ai_runs_all" ON public.ai_runs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "conversations_all" ON public.conversations;
  CREATE POLICY "conversations_all" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "messages_all" ON public.messages;
  CREATE POLICY "messages_all" ON public.messages FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "progress_all" ON public.player_progress;
  CREATE POLICY "progress_all" ON public.player_progress FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "memories_all" ON public.memories;
  CREATE POLICY "memories_all" ON public.memories FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "goals_all" ON public.goals;
  CREATE POLICY "goals_all" ON public.goals FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "quests_all" ON public.quests;
  CREATE POLICY "quests_all" ON public.quests FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
  CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
END $$;
