-- ==============================================================================
-- MENTRA PHASE 6: ALWAYS-AVAILABLE PERSONAL AI & WHATSAPP GATEWAY SCHEMA
-- ==============================================================================

-- 1. WhatsApp Connections Table (Maps phone number to MENTRA user)
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  display_phone_number TEXT,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'READY_TO_CONNECT' CHECK (status IN ('NOT_CONFIGURED', 'READY_TO_CONNECT', 'WAITING_LINK', 'CONNECTED', 'TOKEN_ERROR', 'WEBHOOK_ERROR', 'DISCONNECTED')),
  metadata JSONB DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WhatsApp Account Linking Codes (Single-use, 15-minute TTL)
CREATE TABLE IF NOT EXISTS public.whatsapp_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scheduled Jobs Engine Table (Background Cron & Proactive Jobs)
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MORNING_BRIEF', 'EVENING_REFLECTION', 'REMINDER', 'WEEKLY_REPORT', 'LEARNING_NUDGE', 'FINANCE_ALERT', 'AGENT_SCHEDULE', 'STREAK_CHECK')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  recurrence TEXT NOT NULL DEFAULT 'NONE' CHECK (recurrence IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY')),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETE', 'FAILED', 'CANCELLED', 'PAUSED')),
  deduplication_key TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Job Execution Runs (Audit log of background jobs)
CREATE TABLE IF NOT EXISTS public.job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'RETRYING')),
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Notification Preferences Table (Quiet hours, channel per category)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TEXT DEFAULT '22:30',
  quiet_hours_end TEXT DEFAULT '07:30',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  paused_until TIMESTAMPTZ,
  channels JSONB DEFAULT '{"MORNING_BRIEF": ["WHATSAPP", "WEB"], "FINANCE_ALERT": ["WHATSAPP", "WEB"], "REMINDER": ["WHATSAPP", "WEB"], "LEARNING_NUDGE": ["WHATSAPP", "WEB"], "QUEST_REMINDER": ["WEB"], "EVENING_REFLECTION": ["WHATSAPP", "WEB"], "WEEKLY_REPORT": ["WHATSAPP", "WEB"], "AGENT_COMPLETE": ["WHATSAPP", "WEB"]}'::jsonb,
  categories JSONB DEFAULT '{"QUEST": true, "GOAL": true, "LEARNING": true, "FINANCE": true, "CALENDAR": true, "EMAIL": true, "AGENT": true, "REPORT": true, "JOURNAL": true, "SYSTEM": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Daily Briefs Table (Persisted daily dossier to prevent inconsistent regeneration)
CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  content TEXT NOT NULL,
  priorities JSONB DEFAULT '[]'::jsonb,
  delivery_channels TEXT[] DEFAULT '{"WEB"}'::text[],
  delivery_status JSONB DEFAULT '{"WEB": "DELIVERED"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. Inbound & Outbound WhatsApp Messaging Ledger (Delivery tracking & idempotency)
CREATE TABLE IF NOT EXISTS public.inbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  provider_message_id TEXT NOT NULL UNIQUE,
  sender_phone TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  text TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSED', 'FAILED', 'IGNORED', 'DUPLICATE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  recipient TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'TEMPLATE', 'INTERACTIVE', 'AUDIO')),
  content TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes for Instant Retrieval & Idempotency
CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_user ON public.whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conn_phone ON public.whatsapp_connections(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_code ON public.whatsapp_link_codes(code) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON public.scheduled_jobs(status, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_jobs_dedup ON public.scheduled_jobs(user_id, deduplication_key);
CREATE INDEX IF NOT EXISTS idx_daily_briefs_user_date ON public.daily_briefs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_inbound_provider_msg ON public.inbound_messages(provider_message_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

-- 10. Owner Isolation Policies
CREATE POLICY "whatsapp_connections_owner_all" ON public.whatsapp_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "whatsapp_link_codes_owner_all" ON public.whatsapp_link_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scheduled_jobs_owner_all" ON public.scheduled_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "job_runs_owner_all" ON public.job_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notification_preferences_owner_all" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "daily_briefs_owner_all" ON public.daily_briefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "inbound_messages_owner_all" ON public.inbound_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "outbound_messages_owner_all" ON public.outbound_messages FOR ALL USING (auth.uid() = user_id);
