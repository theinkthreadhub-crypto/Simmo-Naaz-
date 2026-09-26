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
