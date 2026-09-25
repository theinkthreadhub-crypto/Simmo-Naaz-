-- ==============================================================================
-- MENTRA PHASE 7: VOICE-FIRST, MISSION PLANNER, FOCUS & AUTONOMY SCHEMA
-- ==============================================================================

-- 1. Voice Sessions & Transcripts
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'IDLE' NOT NULL, -- 'IDLE' | 'LISTENING' | 'TRANSCRIBING' | 'THINKING' | 'SPEAKING' | 'COMPLETE' | 'ERROR'
  mode VARCHAR(50) DEFAULT 'CONVERSATIONAL' NOT NULL, -- 'CONVERSATIONAL' | 'PUBLIC_SPEAKING' | 'JOURNAL' | 'FOCUS'
  transcript TEXT,
  response_text TEXT,
  duration_seconds NUMERIC(8,2) DEFAULT 0,
  analysis_metrics JSONB DEFAULT '{}'::jsonb,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Public Speaking Voice Practices
CREATE TABLE IF NOT EXISTS public.voice_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id VARCHAR(100) DEFAULT 'public_speaking' NOT NULL,
  topic TEXT NOT NULL,
  transcript TEXT NOT NULL,
  audio_metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- { duration, wpm, fillerCount, pauseCount, clarityScore }
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,      -- { strengths, improvements, nextFocus, score }
  xp_awarded INTEGER DEFAULT 25 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Sovereign Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  timeline_days INTEGER DEFAULT 7 NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  milestones JSONB DEFAULT '[]'::jsonb NOT NULL,
  total_xp INTEGER DEFAULT 200 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Autonomous Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  goal TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'READY' NOT NULL, -- 'DRAFT' | 'READY' | 'RUNNING' | 'WAITING_APPROVAL' | 'PAUSED' | 'COMPLETE' | 'FAILED' | 'CANCELLED'
  priority VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL, -- 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  risk_level VARCHAR(30) DEFAULT 'LOW_RISK_INTERNAL' NOT NULL,
  autonomy_mode VARCHAR(30) DEFAULT 'ASSISTED' NOT NULL, -- 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Plan Steps & Task Graph
CREATE TABLE IF NOT EXISTS public.plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_index INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'RESEARCH' | 'ANALYZE' | 'CREATE_QUEST' | 'CALENDAR_PROPOSAL' | 'FINANCE_CHECK' | 'EXTERNAL_DRAFT' | 'BROWSER_ACTION'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  agent VARCHAR(100),
  tool VARCHAR(100),
  dependencies TEXT[] DEFAULT '{}'::text[],
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETE' | 'FAILED' | 'SKIPPED'
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Focus Sessions
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  planned_duration_min INTEGER DEFAULT 45 NOT NULL,
  actual_duration_min NUMERIC(6,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'RUNNING' NOT NULL, -- 'RUNNING' | 'COMPLETED' | 'CANCELLED'
  reflections TEXT,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 7. Controlled Browser Sessions & Actions
CREATE TABLE IF NOT EXISTS public.browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  current_url TEXT,
  provider VARCHAR(50) DEFAULT 'CONTROLLED_BROWSER_GATEWAY',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.browser_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.browser_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'NAVIGATE' | 'READ_PAGE' | 'CLICK' | 'TYPE' | 'SCREENSHOT' | 'SUBMIT'
  target_url TEXT NOT NULL,
  selector TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  risk_level VARCHAR(30) DEFAULT 'LOW_RISK_INTERNAL' NOT NULL, -- 'READ_ONLY' | 'LOW_RISK_INTERNAL' | 'LOW_RISK_EXTERNAL' | 'SENSITIVE' | 'DESTRUCTIVE' | 'FINANCIAL' | 'SECURITY'
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  screenshot_url TEXT,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Execution Audits
CREATE TABLE IF NOT EXISTS public.execution_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type VARCHAR(50) NOT NULL, -- 'PLAN' | 'MISSION' | 'BROWSER' | 'VOICE' | 'AGENT'
  context_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  action_name VARCHAR(100) NOT NULL,
  risk_level VARCHAR(30) NOT NULL,
  approved_by VARCHAR(50) DEFAULT 'SYSTEM', -- 'USER' | 'SYSTEM' | 'AUTO_INTERNAL'
  status VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Autonomy Settings
CREATE TABLE IF NOT EXISTS public.autonomy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(30) DEFAULT 'ASSISTED' NOT NULL, -- 'MANUAL' | 'ASSISTED' | 'TRUSTED_INTERNAL'
  max_planning_steps INTEGER DEFAULT 8 NOT NULL,
  max_tool_calls INTEGER DEFAULT 12 NOT NULL,
  max_browser_actions INTEGER DEFAULT 5 NOT NULL,
  trusted_internal_actions BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Voice Settings
CREATE TABLE IF NOT EXISTS public.voice_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tts_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  voice_id VARCHAR(100) DEFAULT 'echo' NOT NULL,
  speech_speed NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  language VARCHAR(20) DEFAULT 'hi-IN' NOT NULL,
  auto_speak_responses BOOLEAN DEFAULT TRUE NOT NULL,
  audio_retention_days INTEGER DEFAULT 30 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Owner isolation)
CREATE POLICY "Users access own voice_sessions" ON public.voice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own voice_practices" ON public.voice_practices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own missions" ON public.missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plan_steps" ON public.plan_steps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own focus_sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own browser_sessions" ON public.browser_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own browser_actions" ON public.browser_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own execution_audits" ON public.execution_audits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own autonomy_settings" ON public.autonomy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own voice_settings" ON public.voice_settings FOR ALL USING (auth.uid() = user_id);
