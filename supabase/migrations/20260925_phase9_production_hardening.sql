-- ==============================================================================
-- MENTRA PHASE 9: PRODUCTION HARDENING, RLS MASTER AUDIT & IDEMPOTENCY MIGRATION
-- ==============================================================================

-- 1. Create Audit Logs table for security and governance traceability
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    target_resource TEXT,
    payload_hash TEXT,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'BLOCKED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service and users can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 2. Performance and Idempotency Indexes

-- Habit single-completion per day constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_unique_daily 
    ON public.habit_completions (habit_id, completion_date);

-- Project decisions indexing
CREATE INDEX IF NOT EXISTS idx_decisions_project_user 
    ON public.decisions (project_id, user_id, date);

-- Wellness telemetry user date index
CREATE INDEX IF NOT EXISTS idx_wellness_user_date 
    ON public.wellness_entries (user_id, entry_date);

-- Knowledge entities and edges user indexing
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_type 
    ON public.knowledge_entities (user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_user_relation 
    ON public.knowledge_edges (user_id, relation);

-- Recommendations status and expiry index
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status 
    ON public.recommendations (user_id, status, expires_at);

-- Action approvals pending lookup index
CREATE INDEX IF NOT EXISTS idx_approvals_user_status_expires 
    ON public.action_approvals (user_id, status, expires_at);

-- 3. Comprehensive RLS check function
CREATE OR REPLACE FUNCTION public.check_phase9_rls_compliance()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT AS table_name,
        c.relrowsecurity::BOOLEAN AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY c.relname;
END;
$$;
