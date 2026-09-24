# MENTRA — Personal AI Operating System + Life RPG + Agent Command Center

```
===================================================================
       MENTRA ONLINE — YOUR PERSONAL AI OPERATING SYSTEM
===================================================================
```

MENTRA is an intelligent, command-first Personal AI Operating System and Life RPG engineered to transform real-world operations into quantified character advancement.

---

## 🌟 Core Architecture & Experience

1. **Futuristic 3D AI Core (React Three Fiber + Three.js)**:
   - Central interactive neural orb with floating particle fields and rotating holographic orbital rings.
   - Dynamic cursor reaction with lightweight 2D canvas fallback for reduced-motion and mobile environments.

2. **Command-First Interaction**:
   - Persistent `Ask MENTRA anything...` command bar with integrated microphone UI for voice telemetry.
   - Natural language parser that instantly routes commands to agents, records expenses, queries the memory vault, or schedules daily reflection logs.

3. **Life RPG & Player Progression**:
   - Level, XP, Rank, and 14-Day Streak tracking.
   - 7 Core Attributes: *Focus, Discipline, Knowledge, Business, Finance, Communication, Fitness*.
   - Multi-tiered quest system: *Daily Quests, Main Storylines, Side Missions, Boss Raids*.

4. **Strategic Goals & Milestone Engine**:
   - Sequential milestone breakdowns (e.g., ₹1 Lakh Monthly Revenue with ₹10k, ₹25k, ₹50k, ₹75k, ₹1L gates).

5. **Financial Command HUD**:
   - Dual-scope tracking: Business vs Personal cash flow.
   - Real-time ledger recording, category budgets, and AI burn rate sentinel.

6. **Interactive Skill Matrix & Tech Tree**:
   - Masteries across *Business & Marketing, AI Agent Architecture, Deal Negotiation, Capital Allocation, Focus Sovereignty*.

7. **Second Brain & Neural Memory Vault**:
   - Categorized memory indexing (*Decisions, Projects, Ideas, People, User Preferences*).
   - pgvector-ready embeddings for instant semantic search.

8. **Modular AI Agent Fleet & Approval Gates**:
   - 8 Specialized Agents: *Research Agent, Gmail Agent, Calendar Agent, Drive Agent, Finance Agent, Learning Agent, Business Agent, Memory Agent*.
   - Strict security permission ladder: `READ → ANALYZE → RECOMMEND → ASK APPROVAL → EXECUTE`.

9. **External Gateways**:
   - Google Workspace OAuth foundation (*Gmail, Calendar, Drive, Sheets, Contacts*).
   - WhatsApp Cloud API gateway architecture for mobile voice memo ingestion and executive briefings.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS Variables, Glassmorphism
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **State Management**: Zustand
- **Database & Auth**: Supabase (PostgreSQL with RLS & pgvector)
- **Validation**: Zod
- **Icons**: Lucide React

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 3. Database Initialization
Execute the SQL schema located in `src/lib/supabase/schema.sql` inside your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to access MENTRA.

---

## 🔒 Security Architecture

- Zero client-side API secret exposure.
- Human-in-the-loop approval gates for all destructive or external actions.
- Scoped PostgreSQL Row Level Security (RLS) policies ensuring users only access their own private data.
