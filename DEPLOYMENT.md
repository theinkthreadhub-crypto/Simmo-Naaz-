# MENTRA — Production Deployment & Infrastructure Guide

This guide describes the complete procedure for deploying **MENTRA** to live production infrastructure (Next.js 14 App Router on Vercel/Node + Supabase PostgreSQL).

---

## 1. Prerequisites & Infrastructure Setup

1. **Supabase Production Project:**
   - Create a dedicated Supabase project (e.g. `mentra-production`).
   - Note the **Project URL**, **anon key**, and **service_role key**.
2. **Hosting Platform:**
   - Vercel, Railway, or standard Node.js server with HTTPS support.
3. **Domain & DNS:**
   - Configure a custom domain (e.g., `mentra.yourdomain.com`).
   - Provision SSL certificates (handled automatically by Vercel/Cloudflare).

---

## 2. Database Migration Sequence

Apply the database migrations in sequential order from `supabase/migrations/`:

```bash
# Sequential migration list:
1. 20260924_phase2_complete_schema.sql         # Base profiles, player progression, XP ledger
2. 20260925_phase3_adaptive_learning_schema.sql # Adaptive skill coach & public speaking roadmap
3. 20260925_phase4_ai_core_schema.sql           # Conversations, memories, tools registry
4. 20260925_phase5_connected_mentra_schema.sql  # Google connections, third-party integrations
5. 20260925_phase6_proactive_whatsapp_schema.sql# WhatsApp numbers, scheduler jobs, notifications
6. 20260925_phase7_voice_missions_autonomy_schema.sql # Sovereign missions, speech coaching, autonomy settings
7. 20260925_phase8_knowledge_habits_projects_schema.sql # Knowledge graph, habits, routines, projects
8. 20260925_phase9_production_hardening.sql     # Idempotency indexes, audit logs, RLS compliance
```

---

## 3. Storage Bucket Configuration

In Supabase Dashboard → Storage, create the following private buckets:
- `user_voice_recordings` (Private, 50MB max upload)
- `browser_screenshots` (Private, 10MB max upload)
- `user_documents` (Private, 25MB max upload)

---

## 4. Production Environment Variables

Configure the following variables in your hosting provider's dashboard:

```ini
NEXT_PUBLIC_APP_URL=https://mentra.yourdomain.com
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
TOKEN_ENCRYPTION_KEY=<32-byte-hex-encryption-key>
CRON_SECRET=<secure-random-cron-secret>
AI_PROVIDER=gemini
AI_API_KEY=<your-production-gemini-api-key>
```

---

## 5. Background Scheduler / Cron Setup

Configure an external cron trigger (e.g. Vercel Cron or GitHub Action) to trigger every 5 minutes:
- **HTTP Method:** `POST`
- **URL:** `https://mentra.yourdomain.com/api/cron/dispatch`
- **Header:** `Authorization: Bearer <CRON_SECRET>`

---

## 6. Live Verification & Health Checks

After deployment, verify that the health endpoint returns `HEALTHY`:
```bash
curl https://mentra.yourdomain.com/api/system/health
```
