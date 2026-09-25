# MENTRA — Deployment Rollback & Disaster Recovery Plan

This document outlines the standard emergency procedures for rolling back bad deployments, mitigating data corruption, and restoring platform operations.

---

## 1. Application Deployment Rollback

If a newly deployed build introduces critical runtime regressions:

1. **Vercel / Hosting Rollback:**
   - Navigate to Vercel Deployments dashboard.
   - Locate the previous stable deployment.
   - Click **Instant Rollback** to promote the previous build to production within seconds.
2. **Environment Variable Invalidation:**
   - If an integration key is compromised, immediately rotate `TOKEN_ENCRYPTION_KEY` or the corresponding provider API key in environment settings and trigger redeploy.

---

## 2. Database Migration Rollback Guidelines

- **Non-Destructive Schema Additions:** Table creations, non-null indexes, and additive columns do not need to be dropped during application rollback.
- **Breaking Schema Alterations:**
  - Never execute `DROP TABLE` or `DROP COLUMN` in production migrations without prior 14-day deprecation.
  - If a migration added a bad constraint blocking inserts, issue an emergency patch migration `ALTER TABLE ... DROP CONSTRAINT ...`.

---

## 3. Disaster Recovery & Supabase Point-in-Time Restore

1. **Daily Scheduled Backups:**
   - Supabase automatically maintains daily database snapshots.
2. **Point-in-Time Recovery (PITR):**
   - For Enterprise/Pro Supabase tiers, use the PITR slider to restore database state to any minute prior to the incident.
3. **User Data Integrity Verification:**
   - After restore, execute `SELECT check_phase9_rls_compliance();` to verify RLS policies remain active.
