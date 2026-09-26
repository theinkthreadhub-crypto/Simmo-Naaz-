-- ==============================================================================
-- MENTRA PHASE 17: SYSTEM HEALTH + AUTOMATIC RECOVERY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_recovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  status TEXT NOT NULL DEFAULT 'RECOVERED'
    CHECK (status IN ('RECOVERED', 'FAILED', 'SKIPPED')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_recovery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_recovery_events_owner_read"
  ON public.system_recovery_events;

CREATE POLICY "system_recovery_events_owner_read"
  ON public.system_recovery_events
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.system_recovery_events TO authenticated;

CREATE INDEX IF NOT EXISTS idx_system_recovery_events_user_created
  ON public.system_recovery_events(user_id, created_at DESC);
