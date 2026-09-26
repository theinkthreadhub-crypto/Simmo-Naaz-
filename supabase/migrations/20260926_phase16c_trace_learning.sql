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
