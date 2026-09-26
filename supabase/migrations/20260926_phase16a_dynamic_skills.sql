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
