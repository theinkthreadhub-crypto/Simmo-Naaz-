-- ==============================================================================
-- MENTRA PHASE 5: CONNECTED MENTRA & EXTERNAL AGENTS SCHEMA
-- ==============================================================================

-- 1. Integration Connections Table (Publicly queryable by owner)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'GOOGLE', 'WHATSAPP', etc.
  service TEXT NOT NULL,  -- 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'GOOGLE_CONTACTS', 'WHATSAPP_CLOUD_API', etc.
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ACTION_REQUIRED', 'TOKEN_EXPIRED', 'NOT_CONFIGURED', 'SANDBOX_MODE')),
  account_email TEXT,
  account_id TEXT,
  scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);

-- 2. Integration Tokens Table (STRICT SERVER-ONLY - No client select policy)
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  token_iv TEXT NOT NULL,
  token_tag TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 3. Agent Tasks & Task Queue Table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PLANNING', 'RUNNING', 'WAITING_TOOL', 'WAITING_APPROVAL', 'COMPLETE', 'PARTIAL', 'FAILED', 'CANCELLED')),
  current_stage TEXT DEFAULT 'INITIALIZING',
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Research Runs & Intelligence Reports Table
CREATE TABLE IF NOT EXISTS public.research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  objective TEXT,
  depth TEXT NOT NULL DEFAULT 'STANDARD' CHECK (depth IN ('QUICK', 'STANDARD', 'DEEP')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SEARCHING', 'ANALYZING', 'COMPLETE', 'FAILED')),
  summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. External Action Audit Trail Log
CREATE TABLE IF NOT EXISTS public.external_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  service TEXT NOT NULL, -- 'GMAIL', 'GOOGLE_CALENDAR', 'GOOGLE_SHEETS', etc.
  action_type TEXT NOT NULL, -- 'SEND_EMAIL', 'CREATE_CALENDAR_EVENT', 'UPDATE_SHEET', etc.
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED')),
  approval_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_integrations_user_service ON public.integrations(user_id, service);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_status ON public.agent_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_runs_user ON public.research_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ext_actions_user ON public.external_action_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ext_actions_idempotency ON public.external_action_logs(user_id, idempotency_key);

-- 7. Row Level Security (RLS)
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_action_logs ENABLE ROW LEVEL SECURITY;

-- 8. Owner Isolation Policies
CREATE POLICY "integrations_owner_all" ON public.integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "integration_tokens_owner_all" ON public.integration_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agent_tasks_owner_all" ON public.agent_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "research_runs_owner_all" ON public.research_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "external_action_logs_owner_all" ON public.external_action_logs FOR ALL USING (auth.uid() = user_id);
