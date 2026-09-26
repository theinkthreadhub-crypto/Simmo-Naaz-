-- ==============================================================================
-- MENTRA PHASE 15C: DURABLE APPROVAL EXECUTION
-- ==============================================================================

ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS result JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

ALTER TABLE public.approval_requests
  DROP CONSTRAINT IF EXISTS approval_requests_status_check;

ALTER TABLE public.approval_requests
  ADD CONSTRAINT approval_requests_status_check
  CHECK (status IN (
    'PENDING',
    'EXECUTING',
    'APPROVED',
    'REJECTED',
    'FAILED',
    'EXPIRED'
  ));

CREATE INDEX IF NOT EXISTS idx_approval_requests_pending_expiry
  ON public.approval_requests(user_id, expires_at)
  WHERE status = 'PENDING';
