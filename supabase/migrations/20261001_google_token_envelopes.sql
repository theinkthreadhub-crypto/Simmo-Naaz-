-- Access and refresh tokens have independent AES-GCM authentication data.
ALTER TABLE public.integration_tokens
  ADD COLUMN IF NOT EXISTS refresh_token_iv text,
  ADD COLUMN IF NOT EXISTS refresh_token_tag text;
-- Legacy refresh ciphertext cannot be recovered without its original IV/tag.
-- Reconnecting Google replaces it with a complete authenticated envelope.
