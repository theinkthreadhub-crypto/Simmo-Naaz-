-- ==============================================================================
-- MENTRA P0: Scheduler + notification contract repair
-- Date: 2026-09-26
-- Purpose:
--   Align notification_preferences with the application service contract.
--   Scheduler/job_runs/daily_briefs remain on the canonical Phase-6 column names.
-- ==============================================================================

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS morning_brief_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS morning_brief_time TEXT NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS evening_reflection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS evening_reflection_time TEXT NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quest_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS goal_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS learning_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS finance_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS calendar_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS gmail_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS agent_updates BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT NOT NULL DEFAULT 'WHATSAPP';

-- Backfill explicit toggles from the Phase-6 JSON category map where available.
UPDATE public.notification_preferences
SET
  quest_alerts = COALESCE((categories->>'QUEST')::boolean, quest_alerts),
  goal_alerts = COALESCE((categories->>'GOAL')::boolean, goal_alerts),
  learning_reminders = COALESCE((categories->>'LEARNING')::boolean, learning_reminders),
  finance_alerts = COALESCE((categories->>'FINANCE')::boolean, finance_alerts),
  calendar_alerts = COALESCE((categories->>'CALENDAR')::boolean, calendar_alerts),
  gmail_alerts = COALESCE((categories->>'EMAIL')::boolean, gmail_alerts),
  agent_updates = COALESCE((categories->>'AGENT')::boolean, agent_updates),
  weekly_report = COALESCE((categories->>'REPORT')::boolean, weekly_report);

-- Keep preferred_channel conservative: use WhatsApp only when the Phase-6 map
-- explicitly lists it for reminders; otherwise default to WEB.
UPDATE public.notification_preferences
SET preferred_channel = CASE
  WHEN COALESCE(channels->'REMINDER', '[]'::jsonb) ? 'WHATSAPP' THEN 'WHATSAPP'
  ELSE 'WEB'
END
WHERE preferred_channel IS NULL OR preferred_channel = '';

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_due
  ON public.scheduled_jobs(status, scheduled_for ASC)
  WHERE status = 'SCHEDULED';
