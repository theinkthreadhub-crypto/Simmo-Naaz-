-- MENTRA Phase 8: real voice conversation telemetry and durability.

ALTER TABLE public.voice_sessions
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stt_provider TEXT,
  ADD COLUMN IF NOT EXISTS tts_provider TEXT,
  ADD COLUMN IF NOT EXISTS input_audio_bytes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_created
  ON public.voice_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_conversation
  ON public.voice_sessions(conversation_id)
  WHERE conversation_id IS NOT NULL;
