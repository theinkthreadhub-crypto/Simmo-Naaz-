# MENTRA — Operator Manual & User Guide

Welcome to **MENTRA**, your sovereign Personal AI Operating System and Life RPG.

---

## 1. Core Operating Loops

### A. Life RPG & Daily Quests
- **Quests:** Specific actionable outcomes that award XP.
- **Main Quests vs Side Quests:** Focus on your primary goal first.
- **Habits (`/habits`):** Recurring daily rhythms. Completing a habit awards deterministic XP once per day and builds streaks without streak-penalty on unscheduled days.
- **Routines:** Step-by-step timed execution sequences for Morning Briefing, Deep Work, or Evening Reflections.

### B. MENTRA AI Core & Natural Language
- Talk to MENTRA naturally in English, Hindi, or Hinglish:
  - *“Mera level kya hai?”* → Checks level and XP progress.
  - *“₹500 Meta Ads expense add karo”* → Automatically logs to Finance ledger.
  - *“Public speaking practice karni hai”* → Opens structured coaching lesson.
  - *“Aaj mujhe kya karna chahiye?”* → Builds an intelligent, capacity-aware daily plan.

### C. Projects & Decisions (`/projects`)
- Track strategic multi-step ventures (e.g., *InkThread Summer Drop*).
- Maintain an auditable **Decision Log** capturing the rationale, alternatives considered, and expected outcomes.

### D. Missions & Autonomous Planner (`/missions`)
- Complex multi-step objectives broken down into DAG execution graphs.
- High-risk actions (e.g., sending emails, deleting records, financial payments) require explicit operator approval via the Approvals tray (`/approvals`).

---

## 2. Connections & Integrations (`/connections`)
- **Google Workspace:** Connect Gmail, Calendar, and Drive for unified contextual awareness.
- **WhatsApp Cloud API:** Link your mobile number to interact with MENTRA on the go.
- **Voice Studio (`/mentra/voice`):** Hands-free speech interaction and real-time Public Speaking feedback.

---

## 3. Privacy & Personalization (`/settings/personalization`)
- Control the depth of personalization (`MINIMAL`, `STANDARD`, `DEEP`).
- Enable/disable sensitive context access (Wellness, Finance, Contacts).
- Export your complete user data anytime via structured JSON (`/api/system/export`).
