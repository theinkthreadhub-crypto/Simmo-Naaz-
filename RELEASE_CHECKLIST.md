# MENTRA — Production Release Checklist

Before promoting any release to production, ensure every item on this checklist is verified.

---

## 1. Pre-Deployment Verification

- [ ] **Database Migrations:** All SQL migrations applied sequentially up to `20260925_phase9_production_hardening.sql`.
- [ ] **Row Level Security:** RLS enabled and validated on all user-owned tables.
- [ ] **Environment Configuration:**
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
  - `TOKEN_ENCRYPTION_KEY` set with 32-byte secure key.
  - `AI_API_KEY` configured and verified.
  - `CRON_SECRET` configured for scheduler execution.
- [ ] **Secrets Audit:** No raw API keys, service role keys, or secrets committed in client code or Git history.
- [ ] **Security Headers:** Verified active in `next.config.js` (CSP, X-Frame-Options, Permissions-Policy).

---

## 2. Automated Testing & Build Validation

- [ ] **Type Check:** `npm run typecheck` passes with zero errors.
- [ ] **Linting:** `npm run lint` passes with zero errors.
- [ ] **Production Build:** `npm run build` generates all static and dynamic routes cleanly.
- [ ] **Hardening Evaluation Suite:** `npx tsx scripts/phase9-hardening-eval.ts` passes 100%.

---

## 3. Post-Deployment Smoke Test

- [ ] User authentication (Login / Logout / Session refresh).
- [ ] Create, complete, and verify single-XP award on Quest.
- [ ] Log Habit and verify daily duplicate prevention.
- [ ] Test AI Chat and ensure rate limiting & prompt injection delimiters are active.
- [ ] Verify `/api/system/health` reports `HEALTHY` or appropriate `CONFIG_REQUIRED` states without crashing.
