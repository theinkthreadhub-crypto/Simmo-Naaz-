# MENTRA — Production Operations Runbook

This runbook describes standard operational procedures for incident diagnosis, recovery, and degradation management for the **MENTRA** platform.

---

## 1. Incident Scenarios & Standard Operating Procedures

### Scenario A: AI Provider Degradation / Outage
- **Symptoms:** Chat requests timing out or returning 500/503. Circuit breaker for `ai_provider` transitions to `OPEN`.
- **System Behavior:** Automatic graceful degradation. Manual Life RPG (Quests, Habits, Routines, Goals, Finance) remains fully operational.
- **Remediation:**
  1. Check AI Provider status page (e.g. Google Gemini / OpenAI / Anthropic).
  2. Verify API key quotas in provider console.
  3. If primary model is overloaded, configure `AI_MODEL_FAST` fallback in `.env.local`.
  4. Once resolved, the circuit breaker will automatically transition to `HALF_OPEN` and resume traffic.

---

### Scenario B: Google OAuth Token Refresh Failure
- **Symptoms:** Google Calendar or Gmail operations fail with `TOKEN_EXPIRED` or 401.
- **System Behavior:** System sets capability status to `CONFIG_REQUIRED` or `DEGRADED`.
- **Remediation:**
  1. Instruct user to visit `/connections` and click **Reconnect Google Account**.
  2. Check GCP Console to ensure OAuth consent screen has not revoked refresh token privileges.

---

### Scenario C: WhatsApp Webhook Failure or High Error Rate
- **Symptoms:** Inbound WhatsApp messages not processing; webhook returns 401 or 500.
- **System Behavior:** Replay protection drops duplicate payloads; error logger flags signature mismatch.
- **Remediation:**
  1. Verify `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET` match Meta App Settings.
  2. Ensure Meta Webhook URL is pointing to active HTTPS production endpoint (`/api/whatsapp/webhook`).

---

### Scenario D: Background Cron or Stale Job Buildup
- **Symptoms:** Scheduled jobs not firing or long-running agent tasks stuck in `RUNNING`.
- **Remediation:**
  1. Trigger manual retention and stale state cleanup via `executeRetentionCleanup()`.
  2. Verify Vercel / External Cron scheduler is passing `Authorization: Bearer <CRON_SECRET>` in requests to `/api/cron/dispatch`.

---

## 2. Diagnostics & Health Monitoring

- **System Health Endpoint:** `GET /api/system/health`
  - Returns capability matrix (`CONNECTED`, `CONFIG_REQUIRED`, `DEGRADED`), environment audit, and circuit breaker states.
- **User Observability Dashboard:** Navigate to `/system` in the web application.
- **User Data Export:** `GET /api/system/export` returns complete structured JSON export of user progress, habits, routines, projects, and telemetry.
