# MENTRA — Production Release Gate

This checklist is the source of truth for promoting MENTRA to production.

## 1. Core release gate — mandatory

- [ ] Dedicated **MENTRA Supabase** project is connected. Never reuse the InkThread Hub store database.
- [ ] All migrations in `supabase/migrations/` are applied in filename order through:
  - `20260926_phase14_jarvis_core_foundation.sql`
  - `20260926_phase15a_operative_monitors.sql`
  - `20260926_phase15b_brain_worker_whatsapp_qr.sql`
  - `20260926_phase15c_approval_execution.sql`
  - `20260926_phase16a_dynamic_skills.sql`
  - `20260926_phase16b_memory_extraction_dedup.sql`
  - `20260926_phase16c_trace_learning.sql`
  - `20260926_phase17_system_health_recovery.sql`
- [ ] RLS/security advisors reviewed after migrations.
- [ ] Production Vercel env has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `TOKEN_ENCRYPTION_KEY`
  - `CRON_SECRET`
  - `BRAIN_WORKER_SECRET` when persistent worker is enabled
- [ ] `/api/system/health` reports core environment HEALTHY.
- [ ] Production auth smoke test: sign up/sign in/session refresh/sign out.

## 2. AI / Jarvis runtime — mandatory for full intelligent mode

- [ ] `AI_PROVIDER=gemini` (or another explicitly supported provider)
- [ ] `AI_API_KEY`
- [ ] `AI_MODEL_FAST`, `AI_MODEL_SMART`, `AI_MODEL_AGENT`, `AI_MODEL_RESEARCH`
- [ ] `AI_MEMORY_V2=true`
- [ ] Semantic memory store/search test passes.
- [ ] Agent Runtime V2 is enabled only after schema + approval smoke tests:
  - `AI_AGENT_RUNTIME_V2=true`
- [ ] Tool approval flow tested end-to-end.
- [ ] Secret/PII audit redaction verified.

## 3. Proactive / Operative mode

- [ ] Scheduler dispatch has a valid `CRON_SECRET`.
- [ ] Create one test monitor through `scheduleMonitor`.
- [ ] Verify scheduled job claim → run → recurrence → notification state.
- [ ] Automatic recovery leaves no stale CLAIMED/RUNNING job.
- [ ] `SYSTEM_AUTO_RECOVERY=true` unless deliberately disabled.

## 4. Optional integrations

### Google Workspace
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] OAuth redirect configured.
- [ ] Gmail search/read/draft/send approval flow verified.
- [ ] Calendar read/create approval flow verified.
- [ ] Drive/Sheets permission scope verified.

### WhatsApp Cloud API
- [ ] `WHATSAPP_PHONE_NUMBER_ID`
- [ ] `WHATSAPP_ACCESS_TOKEN`
- [ ] `WHATSAPP_VERIFY_TOKEN`
- [ ] `WHATSAPP_APP_SECRET`
- [ ] Webhook verification + signature validation tested.

### Personal WhatsApp QR
- [ ] Persistent `brain-worker/` deployed outside serverless compute.
- [ ] Same `BRAIN_WORKER_SECRET` configured in app and worker.
- [ ] Worker heartbeat is HEALTHY.
- [ ] QR session expires safely and auth directory is persistent/private.

### Browser automation
- [ ] `BROWSER_API_KEY`
- [ ] Read-page test passes.
- [ ] Click/type/submit remain approval-gated.
- [ ] SSRF protection and prompt-injection sanitization verified.

## 5. Automated verification

- [x] GitHub Actions workflow exists on `main`.
- [x] Node.js 22 verification.
- [x] `npm ci`.
- [x] `npm run typecheck`.
- [x] `npm run build`.
- [ ] Production environment health gate is HEALTHY.
- [ ] Production runtime error scan clean after final activation.

## 6. Release behavior

If mandatory core configuration is absent in production, MENTRA must **fail closed**:
- no demo DB
- no placeholder authentication
- no fake success
- no background-action claims
- show the Production Core Setup Required screen
- keep `/api/system/health` available for diagnosis

A build being READY is not sufficient by itself. Production is considered fully ready only when code/build/CI are green **and** the mandatory core environment + database schema are verified.
