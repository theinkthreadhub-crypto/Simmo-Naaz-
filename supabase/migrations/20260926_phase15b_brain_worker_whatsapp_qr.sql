-- ==============================================================================
-- MENTRA PHASE 15B: PERSISTENT BRAIN WORKER + WHATSAPP QR SESSION STATE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.brain_worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ONLINE',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brain_worker_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brain_worker_heartbeats_owner_read"
  ON public.brain_worker_heartbeats;
CREATE POLICY "brain_worker_heartbeats_owner_read"
  ON public.brain_worker_heartbeats
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.brain_worker_heartbeats TO authenticated;

CREATE TABLE IF NOT EXISTS public.whatsapp_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL DEFAULT 'brain-worker',
  status TEXT NOT NULL DEFAULT 'DISCONNECTED'
    CHECK (status IN ('WAITING_QR', 'QR_READY', 'CONNECTED', 'DISCONNECTED', 'ERROR')),
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  connected_number TEXT,
  connected_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_qr_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_qr_sessions_owner_read"
  ON public.whatsapp_qr_sessions;
CREATE POLICY "whatsapp_qr_sessions_owner_read"
  ON public.whatsapp_qr_sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.whatsapp_qr_sessions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_sessions_status
  ON public.whatsapp_qr_sessions(status, updated_at DESC);
