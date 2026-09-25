-- ====================================================================
-- MENTRA PHASE 13: SECURE TEAM & COLLABORATION LAYER SCHEMA
-- ====================================================================

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS', 'TEAM')),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Workspace Invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Workspace Tasks
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'LAUNCH_CRITICAL')),
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETE', 'CANCELLED')),
    blocker_reason TEXT,
    review_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Workspace Comments & Mentions
CREATE TABLE IF NOT EXISTS public.workspace_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Workspace Activity & Audit Trail
CREATE TABLE IF NOT EXISTS public.workspace_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Workspace Approval Policies
CREATE TABLE IF NOT EXISTS public.workspace_approval_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    min_role TEXT NOT NULL CHECK (min_role IN ('OWNER', 'ADMIN', 'MANAGER', 'EDITOR')),
    requires_review BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, action_type)
);

-- 8. Workspace Memory Vault (Shared Business Knowledge)
CREATE TABLE IF NOT EXISTS public.workspace_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('BUSINESS_DECISION', 'SUPPLIER_CONTEXT', 'CAMPAIGN_LEARNING', 'PRODUCT_INSIGHT', 'PROCESS', 'POLICY', 'PROJECT_CONTEXT', 'TEAM_DECISION')),
    content TEXT NOT NULL,
    confidence NUMERIC(3,2) DEFAULT 0.90,
    source TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_ws_status ON public.workspace_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned ON public.workspace_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_task ON public.workspace_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_ws ON public.workspace_activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_memories_ws ON public.workspace_memories(workspace_id, category);

-- Enable RLS on all workspace tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memories ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks with explicit search_path
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = u_id
          AND status = 'ACTIVE'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = u_id
          AND status = 'ACTIVE'
          AND role IN ('OWNER', 'ADMIN')
    );
$$;

-- RLS Policies (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces" ON public.workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (
        owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid()) OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can manage workspace members" ON public.workspace_members;
CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
    FOR ALL USING (
        public.is_workspace_admin_or_owner(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can view workspace tasks" ON public.workspace_tasks
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can insert workspace tasks" ON public.workspace_tasks
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can update workspace tasks" ON public.workspace_tasks;
CREATE POLICY "Members can update workspace tasks" ON public.workspace_tasks
    FOR UPDATE USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace comments" ON public.workspace_comments;
CREATE POLICY "Members can view workspace comments" ON public.workspace_comments
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace comments" ON public.workspace_comments;
CREATE POLICY "Members can insert workspace comments" ON public.workspace_comments
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace memories" ON public.workspace_memories;
CREATE POLICY "Members can view workspace memories" ON public.workspace_memories
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert workspace memories" ON public.workspace_memories;
CREATE POLICY "Members can insert workspace memories" ON public.workspace_memories
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can view workspace activity" ON public.workspace_activity;
CREATE POLICY "Members can view workspace activity" ON public.workspace_activity
    FOR SELECT USING (
        public.is_workspace_member(workspace_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members can log workspace activity" ON public.workspace_activity;
CREATE POLICY "Members can log workspace activity" ON public.workspace_activity
    FOR INSERT WITH CHECK (
        public.is_workspace_member(workspace_id, auth.uid())
    );
