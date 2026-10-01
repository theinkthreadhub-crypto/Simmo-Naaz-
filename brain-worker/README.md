# MENTRA WhatsApp worker

Runs a persistent Baileys socket for your personal WhatsApp account. Default access is only your linked account's **Message yourself** chat. Other contacts require an explicit WHATSAPP_ALLOWED_NUMBERS allowlist.

## Setup

1. Set MENTRA_BASE_URL to your deployed MENTRA URL and MENTRA_USER_ID to the owner Supabase user UUID.
2. Configure BRAIN_WORKER_PRIVATE_KEY_B64 in Render. Its public key must match the provisioned key in src/lib/worker/trustedPublicKey.ts, or BRAIN_WORKER_PUBLIC_KEY on the application. Never commit the private key.
3. Alternatively configure a random secret of at least 32 characters on both services. Public/default credentials are rejected.
4. The application requires SUPABASE_SERVICE_ROLE_KEY for verified worker operations. Normal browser requests keep RLS active.
5. Set WHATSAPP_SELF_CHAT=true and WHATSAPP_AUTH_STORE=remote. Remote auth persists linked-device credentials across worker restarts. Local mode requires persistent storage.
6. Run npm ci then npm start. For local development use npm run start:local with an untracked .env.
7. Sign into MENTRA and open /connections/whatsapp. Scan the QR using WhatsApp > Linked devices > Link a device.
8. Open **Message yourself**, send a message, and wait for the reply prefixed with MENTRA.

QR images are generated inside MENTRA. The worker's public /qr and /logout endpoints reject requests. Relinking/disconnecting is done in the authenticated application. Bot replies and repeated notify/append events are ignored to prevent loops and double replies. Messages are queued so follow-up questions use the same conversation.

A real AI provider must be configured for general AI reasoning. A configured deterministic fallback supports only its implemented commands. A free Render service can sleep; continuous availability requires a persistent host/plan.
