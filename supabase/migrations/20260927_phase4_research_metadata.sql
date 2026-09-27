ALTER TABLE public.research_runs
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS synthesis_mode TEXT CHECK (synthesis_mode IN ('AI_SYNTHESIS','EVIDENCE_ONLY')),
  ADD COLUMN IF NOT EXISTS source_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_research_runs_user_created
  ON public.research_runs(user_id, created_at DESC);
