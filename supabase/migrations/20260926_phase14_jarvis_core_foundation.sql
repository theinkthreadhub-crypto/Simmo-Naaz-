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
