# MENTRA Brain Worker

Persistent Node.js worker for MENTRA background execution.

## Production role

The default production role is deliberately small and durable:

- scheduler tick trigger
- background monitor execution through the MENTRA API
- worker heartbeat / liveness reporting

Official WhatsApp messaging uses the **Meta WhatsApp Cloud API** in the main
MENTRA application. The worker does not need a personal WhatsApp session for
that mode.

## Optional linked-device mode

`WHATSAPP_WORKER_MODE=baileys` enables the existing Baileys QR/WebSocket
bridge. Baileys is an unofficial WhatsApp Web library and is not affiliated
with WhatsApp. Keep this mode disabled unless you explicitly want the
linked-device workflow.

When disabled, the worker does not require a Supabase refresh token.

## Run

1. Copy `.env.example` to `.env`.
2. Set `MENTRA_BASE_URL`.
3. Set the same long random `BRAIN_WORKER_SECRET` in MENTRA and this worker.
4. Set `CRON_SECRET` to the same server-side value used by MENTRA.
5. Keep `SCHEDULER_ENABLED=true`.
6. Keep `WHATSAPP_WORKER_MODE=disabled` for official Cloud API production.
7. Run `npm install`.
8. Run `npm start`.

The worker triggers `/api/cron/dispatch` at the configured interval. MENTRA
uses database leases and idempotency keys so concurrent or restarted workers
do not intentionally execute the same scheduled action twice.

## Persistent host

Run this worker on a persistent Node host/container such as an Oracle Cloud VM
or another always-on container host. It should not run as a Vercel serverless
function.

If Baileys mode is enabled, mount persistent storage for `data/`. That folder
contains linked-device credentials and the rotated user session and must never
be committed.
