# MENTRA Brain Worker

Persistent Node.js worker for capabilities that do not fit Vercel serverless execution:

- personal WhatsApp QR connection
- long-lived Baileys WebSocket
- MENTRA inbound command bridge
- scheduler tick trigger
- worker heartbeat

## WhatsApp mode

The QR mode uses **Baileys**, an unofficial WhatsApp Web library. It is not the Meta WhatsApp Cloud API and is not affiliated with WhatsApp. MENTRA keeps the existing official Cloud API integration as a separate mode.

## Run

1. Copy `.env.example` to `.env`.
2. Set the same long random `BRAIN_WORKER_SECRET` in MENTRA and this worker.
3. Add the MENTRA Supabase project URL/publishable key.
4. Add the MENTRA user's Supabase refresh token.
5. Set `CRON_SECRET` to the same server-side value used by MENTRA.
6. Run `npm install`.
7. Run `npm start`.
8. Scan the terminal QR, or display the current QR from authenticated MENTRA UI using `/api/whatsapp/qr`.

Never commit `data/`. It stores the WhatsApp linked-device credentials and the rotated Supabase session.

## Deployment

Run this worker on a persistent Node host/container, not inside a Vercel serverless function. It needs a long-lived WebSocket and local/persistent credential storage.
