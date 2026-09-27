-- MENTRA Phase 6: durable WhatsApp + scheduler leases.

ALTER TABLE public.scheduled_jobs
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_stale_claims
  ON public.scheduled_jobs(status, lease_expires_at)
  WHERE status IN ('CLAIMED', 'RUNNING');

CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_jobs_active_dedup_unique
  ON public.scheduled_jobs(user_id, deduplication_key)
  WHERE deduplication_key IS NOT NULL
    AND status IN ('SCHEDULED', 'CLAIMED', 'RUNNING', 'PAUSED');

ALTER TABLE public.outbound_messages
  ADD COLUMN IF NOT EXISTS deduplication_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_outbound_messages_dedup_unique
  ON public.outbound_messages(user_id, deduplication_key)
  WHERE user_id IS NOT NULL AND deduplication_key IS NOT NULL;

ALTER TABLE public.inbound_messages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.inbound_messages
  DROP CONSTRAINT IF EXISTS inbound_messages_status_check;

ALTER TABLE public.inbound_messages
  ADD CONSTRAINT inbound_messages_status_check
  CHECK (status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED', 'DUPLICATE'));

CREATE OR REPLACE FUNCTION public.consume_whatsapp_link_code(
  p_code TEXT,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record public.whatsapp_link_codes%ROWTYPE;
BEGIN
  IF p_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'INVALID_LINK_CODE';
  END IF;

  IF p_phone !~ '^[0-9]{8,15}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE_NUMBER';
  END IF;

  SELECT *
    INTO v_record
  FROM public.whatsapp_link_codes
  WHERE code = p_code
    AND used = FALSE
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_LINK_CODE';
  END IF;

  INSERT INTO public.whatsapp_connections (
    user_id,
    phone_number,
    display_phone_number,
    verified,
    status,
    last_active_at,
    updated_at
  ) VALUES (
    v_record.user_id,
    p_phone,
    '+' || p_phone,
    TRUE,
    'CONNECTED',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    phone_number = EXCLUDED.phone_number,
    display_phone_number = EXCLUDED.display_phone_number,
    verified = TRUE,
    status = 'CONNECTED',
    last_active_at = NOW(),
    updated_at = NOW();

  UPDATE public.whatsapp_link_codes
  SET used = TRUE
  WHERE id = v_record.id;

  RETURN v_record.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_whatsapp_link_code(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_whatsapp_link_code(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.consume_whatsapp_link_code(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_whatsapp_link_code(TEXT, TEXT) TO service_role;
