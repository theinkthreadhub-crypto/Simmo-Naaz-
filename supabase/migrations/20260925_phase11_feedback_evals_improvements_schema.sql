-- ==============================================================================
-- MENTRA PHASE 11: FEEDBACK INTELLIGENCE, CORRECTIONS & EVALS SCHEMA
-- ==============================================================================

-- 1. User Feedback Table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- 'MENTRA_CHAT', 'RECOMMENDATION', 'LEARNING', 'DAILY_PLAN', 'ROUTINE', 'MISSION'
    response_id TEXT,
    conversation_id TEXT,
    agent_run_id TEXT,
    recommendation_id TEXT,
    rating TEXT NOT NULL, -- 'HELPFUL', 'NOT_HELPFUL', 'EXCELLENT', 'WRONG_FACT', 'TOO_LONG', 'TOO_SHORT', 'BAD_TIMING'
    reason TEXT,
    optional_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback"
    ON public.user_feedback FOR ALL
    USING (auth.uid() = user_id);

-- 2. User Corrections Table
CREATE TABLE IF NOT EXISTS public.user_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    correction_type TEXT NOT NULL, -- 'WRONG_FACT', 'OUTDATED_FACT', 'WRONG_PREFERENCE', 'WRONG_PRIORITY', 'WRONG_PROJECT', 'WRONG_DATE'
    target_entity_type TEXT NOT NULL, -- 'GOAL', 'PROJECT', 'PREFERENCE', 'MEMORY', 'HABIT'
    target_entity_id TEXT,
    old_value TEXT,
    new_value TEXT NOT NULL,
    is_durable BOOLEAN NOT NULL DEFAULT TRUE, -- false for temporary day context
    status TEXT NOT NULL DEFAULT 'APPLIED', -- 'APPLIED', 'REVERTED', 'PENDING'
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own corrections"
    ON public.user_corrections FOR ALL
    USING (auth.uid() = user_id);

-- 3. Prompt Versions Registry Table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name TEXT NOT NULL,
    version TEXT NOT NULL, -- e.g. 'v1.0.0', 'v1.1.0'
    template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (prompt_name, version)
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt versions readable by authenticated users"
    ON public.prompt_versions FOR SELECT
    USING (true);

-- 4. System Issues & Error Clustering Table
CREATE TABLE IF NOT EXISTS public.system_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type TEXT NOT NULL, -- 'AI_MALFORMED_TOOL', 'OAUTH_TOKEN_EXPIRED', 'AGENT_TIMEOUT', 'WHATSAPP_REPLAY'
    severity TEXT NOT NULL DEFAULT 'SEV3', -- 'SEV1', 'SEV2', 'SEV3', 'SEV4'
    module TEXT NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    sample_run_id TEXT,
    status TEXT NOT NULL DEFAULT 'DETECTED', -- 'DETECTED', 'INVESTIGATING', 'RESOLVED'
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System issues viewable by authenticated users"
    ON public.system_issues FOR SELECT
    USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_feature ON public.user_feedback(user_id, feature, created_at);
CREATE INDEX IF NOT EXISTS idx_user_corrections_user_type ON public.user_corrections(user_id, target_entity_type);
CREATE INDEX IF NOT EXISTS idx_system_issues_module ON public.system_issues(module, status);
