-- MENTRA Phase 5: production Google Workspace token hardening.
-- IMPORTANT: deploy application code using server-only token access before
-- removing the legacy owner policy in production.

ALTER TABLE public.integration_tokens
  ADD COLUMN IF NOT EXISTS refresh_token_iv TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_tag TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_action_idempotency_unique
  ON public.external_action_logs(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- integration_tokens is a server-only secret store. Application code accesses
-- it through the service-role key after authenticating the end user separately.
DROP POLICY IF EXISTS "integration_tokens_owner_all"
  ON public.integration_tokens;
