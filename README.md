# MENTRA — Personal AI Operating System + Life RPG + AI Agent Command Center

```
========================================================================================
                      MENTRA ONLINE — YOUR PERSONAL AI OPERATING SYSTEM
========================================================================================
```

MENTRA is an intelligent, command-first Personal AI Operating System and Life RPG engineered to transform real-world actions into quantified character advancement.

---

## 🌟 Core Architecture & 8-Scene Storyline

1. **Scene 1: System Core & Boot Experience**:
   - Central interactive 3D AI Core (`MentraCore3D.tsx`) with floating particles and 8 orbiting agent nodes.
   - Dynamic cursor reaction with lightweight 2D canvas fallback.

2. **Scene 2: Sovereign Player Telemetry**:
   - Level 07 Vanguard Architect, 680 / 1000 XP progression, 12-day streak multiplier.
   - 7 Core Attributes: *Focus, Discipline, Knowledge, Business, Finance, Communication, Fitness*.

3. **Scene 3: Life RPG Protocols & Quests**:
   - Multi-tiered quest architecture: *Daily Quests, Main Storylines, Side Missions, Boss Raids*.
   - Action verification to prevent meaningless XP farming.

4. **Scene 4: Autonomous AI Agent Fleet**:
   - 8 Specialized Agents: *Research Agent, Gmail Agent, Calendar Agent, Drive Agent, Finance Agent, Learning Agent, Business Agent, Memory Agent*.
   - Strict human-in-the-loop permission ladder: `READ → ANALYZE → RECOMMEND → ASK APPROVAL → EXECUTE`.

5. **Scene 5: Financial Velocity HUD**:
   - Dual-scope tracking: Business vs Personal cash flow.
   - Real-time ledger recording, category budgets, and AI burn rate sentinel.

6. **Scene 6: Interactive Skill Tree Matrix**:
   - Masteries across *Business & Marketing, AI Agent Architecture, Deal Negotiation, Capital Allocation, Focus Sovereignty*.

7. **Scene 7: Second Brain & Neural Memory Vault**:
   - Categorized memory indexing (*Decisions, Projects, Ideas, People, User Preferences*).
   - pgvector-ready embeddings for instant semantic search.

8. **Scene 8: Operational Audit & Reports**:
   - Weekly executive briefing synthesizing level progression, revenue run-rate, and bottleneck resolutions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Dark Glassmorphism, Electric Cyan (`#00f2fe`) & Muted Violet (`#8b5cf6`) Accents
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Motion & Scroll**: GSAP with ScrollTrigger, Framer Motion
- **State Management**: Zustand
- **Database & Auth**: Supabase (PostgreSQL with RLS & pgvector)
- **Validation**: Zod
- **Icons**: Lucide React

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with fonts & meta
│   ├── page.tsx           # 8-Scene 3D scroll story & Command Hub
│   ├── system/            # System Core diagnostics & kernel state
│   ├── quests/            # Life RPG Quest Matrix
│   ├── goals/             # Strategic Goals & Milestones
│   ├── finance/           # Financial HUD & Ledger
│   ├── skills/            # Interactive Skill Tree
│   ├── journal/           # Daily Reflection Journal
│   ├── calendar/          # Time Horizon & Protected Focus Blocks
│   ├── memory/            # Second Brain Memory Vault
│   ├── agents/            # Autonomous Fleet & Approval Gates
│   ├── reports/           # Weekly Executive Reports
│   ├── connections/       # Google Workspace & WhatsApp Cloud API
│   └── settings/          # Operator Preferences & Security
├── components/
│   ├── 3d/                # MentraCore3D & WebGL Canvas
│   ├── navigation/        # Desktop SidebarNav & MobileNav
│   ├── mentra/            # CommandBar, HUDOverlay, SystemStatus, PlayerLevel, XPBar, StatCard, MemoryCard
│   ├── quests/            # QuestCard
│   ├── finance/           # FinanceCard
│   ├── skills/            # SkillNode
│   └── agents/            # AgentStatusCard, AgentNode
├── lib/
│   ├── agents/            # MentraCoreAgent orchestrator & intent parser
│   ├── google/            # Google Workspace OAuth gateway
│   ├── whatsapp/          # WhatsApp Cloud API gateway
│   ├── store/             # Zustand reactive state store
│   └── supabase/          # Supabase client & schema.sql
└── types/
    └── mentra.ts          # Core TypeScript data definitions
```

---

## 🚀 Quickstart & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment Variables
cp .env.example .env.local

# 3. Run development server
npm run dev

# 4. Open http://localhost:3010
```

---

## 🔒 Security & Permission Model

- Zero client-side API secret exposure.
- Human-in-the-loop approval gates for all destructive or external actions.
- Scoped PostgreSQL Row Level Security (RLS) policies ensuring users only access their own private data.
