-- ==============================================================================
-- MENTRA PHASE 15A: OPERATIVE MONITORS
-- ==============================================================================

ALTER TABLE public.scheduled_jobs
  DROP CONSTRAINT IF EXISTS scheduled_jobs_recurrence_check;

ALTER TABLE public.scheduled_jobs
  ADD CONSTRAINT scheduled_jobs_recurrence_check
  CHECK (recurrence IN ('NONE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'));

CREATE INDEX IF NOT EXISTS idx_scheduled_agent_jobs
  ON public.scheduled_jobs(user_id, status, scheduled_for)
  WHERE type = 'AGENT_SCHEDULE';
