-- Production workspace bootstrap + invitation policies.
-- Applied to the MENTRA Supabase project on 2026-09-27.

DROP POLICY IF EXISTS "Users can create own workspaces" ON public.workspaces;
CREATE POLICY "Users can create own workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Workspace owners can add initial owner member" ON public.workspace_members;
CREATE POLICY "Workspace owners can add initial owner member"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role = 'OWNER'
  AND status = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id
      AND w.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Invitees can view their invitations" ON public.workspace_invitations;
CREATE POLICY "Invitees can view their invitations"
ON public.workspace_invitations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
);

DROP POLICY IF EXISTS "Invitees can accept their invitations" ON public.workspace_invitations;
CREATE POLICY "Invitees can accept their invitations"
ON public.workspace_invitations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
  AND status = 'PENDING'
)
WITH CHECK (
  lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
  AND status = 'ACCEPTED'
);

DROP POLICY IF EXISTS "Accepted invitees can join workspace" ON public.workspace_members;
CREATE POLICY "Accepted invitees can join workspace"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND status = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM public.workspace_invitations i
    WHERE i.workspace_id = workspace_id
      AND lower(i.email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
      AND i.status = 'ACCEPTED'
      AND i.role = role
  )
);
