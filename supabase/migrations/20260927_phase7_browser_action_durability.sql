-- MENTRA Phase 7: browser action durability and idempotency.

ALTER TABLE public.browser_actions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_browser_actions_user_idempotency_unique
  ON public.browser_actions(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_browser_actions_session_executed
  ON public.browser_actions(session_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_status_updated
  ON public.browser_sessions(user_id, status, updated_at DESC);
