-- ==============================================================================
-- MENTRA PHASE 8: PERSONAL KNOWLEDGE GRAPH, HABITS, ROUTINES & PROJECTS SCHEMA
-- ==============================================================================

-- 1. Knowledge Graph Entities & Edges
CREATE TABLE IF NOT EXISTS public.knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'PERSON' | 'PROJECT' | 'BUSINESS' | 'GOAL' | 'SKILL' | 'QUEST' | 'HABIT' | 'ROUTINE' | 'DECISION' | 'TOPIC' | 'MEMORY'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  provenance_type VARCHAR(50) DEFAULT 'USER_EXPLICIT' NOT NULL, -- 'FACT' | 'USER_PREFERENCE' | 'USER_DECISION' | 'AI_INFERENCE' | 'SYSTEM_CALCULATION'
  source VARCHAR(100) DEFAULT 'USER_EXPLICIT' NOT NULL, -- 'USER_EXPLICIT' | 'JOURNAL' | 'CONVERSATION' | 'QUEST' | 'GOAL' | 'AGENT_RESEARCH' | 'FINANCE' | 'LEARNING'
  confidence NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  verified_by_user BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES public.knowledge_entities(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.knowledge_entities(id) ON DELETE CASCADE NOT NULL,
  relation_type VARCHAR(50) NOT NULL, -- 'OWNS' | 'WORKS_ON' | 'RELATED_TO' | 'DEPENDS_ON' | 'SUPPORTS' | 'REQUIRES_SKILL' | 'HAS_QUEST' | 'MENTIONED_IN'
  confidence NUMERIC(3,2) DEFAULT 1.0 NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Projects & Strategic Decision Ledger
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objective TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'PAUSED' | 'COMPLETE'
  health VARCHAR(50) DEFAULT 'ON_TRACK' NOT NULL,
  priority VARCHAR(20) DEFAULT 'HIGH' NOT NULL,
  target_date DATE,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  collaborators JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ name, role, email, context }]
  finance_budget NUMERIC(12,2) DEFAULT 0,
  finance_spent NUMERIC(12,2) DEFAULT 0,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  rationale TEXT NOT NULL,
  alternatives TEXT[] DEFAULT '{}'::text[],
  expected_outcome TEXT,
  actual_outcome TEXT,
  status VARCHAR(50) DEFAULT 'DECIDED' NOT NULL, -- 'DECIDED' | 'EVALUATED' | 'REVISED'
  source VARCHAR(50) DEFAULT 'OPERATOR' NOT NULL,
  decided_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Habits & Deterministic Completion Tracking
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  life_area VARCHAR(50) DEFAULT 'Personal Growth' NOT NULL, -- 'Business' | 'Finance' | 'Learning' | 'Health & Fitness' | 'Personal Growth' | 'Creativity'
  frequency VARCHAR(50) DEFAULT 'DAILY' NOT NULL, -- 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'CUSTOM'
  target_count INTEGER DEFAULT 1 NOT NULL,
  preferred_time VARCHAR(20) DEFAULT 'MORNING', -- 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME'
  difficulty VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  related_skill_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
  xp_reward INTEGER DEFAULT 15 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  source VARCHAR(50) DEFAULT 'WEB' NOT NULL,
  xp_awarded INTEGER DEFAULT 15 NOT NULL,
  CONSTRAINT unique_habit_daily_completion UNIQUE (habit_id, completion_date)
);

-- 4. Routines & Runs
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  routine_type VARCHAR(50) DEFAULT 'MORNING' NOT NULL, -- 'MORNING' | 'NIGHT' | 'DEEP_WORK' | 'WEEKEND' | 'CUSTOM'
  duration_minutes INTEGER DEFAULT 30 NOT NULL,
  steps JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ step_index, title, duration_min, action_type, ref_id }]
  trigger_time VARCHAR(10), -- e.g. "07:30"
  days TEXT[] DEFAULT '{"MON","TUE","WED","THU","FRI","SAT","SUN"}'::text[],
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.routine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  run_date DATE NOT NULL,
  completed_steps INTEGER DEFAULT 0 NOT NULL,
  total_steps INTEGER NOT NULL,
  duration_minutes NUMERIC(6,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'COMPLETED' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Behavioral Patterns & Recommendations
CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- 'TIME_PREFERENCE' | 'TASK_DURATION' | 'LEARNING_WINDOW' | 'ROUTINE_COMPLETION' | 'NOTIFICATION_INTERACTION'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.7 NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb NOT NULL,
  last_observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'NEXT_QUEST' | 'LEARNING_NUDGE' | 'ROUTINE_ADJUST' | 'FINANCE_REVIEW' | 'PROJECT_ACTION' | 'GOAL_CHECK'
  title VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8 NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  status VARCHAR(50) DEFAULT 'NEW' NOT NULL, -- 'NEW' | 'VIEWED' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'ACCEPTED' | 'DISMISSED' | 'HELPFUL' | 'NOT_HELPFUL'
  feedback_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Privacy-Gated Wellness Tracking
CREATE TABLE IF NOT EXISTS public.wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  sleep_hours NUMERIC(4,2),
  energy_rating VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW' | 'NORMAL' | 'HIGH'
  mood_rating VARCHAR(20) DEFAULT 'GOOD', -- 'LOW' | 'NEUTRAL' | 'GOOD' | 'EXCELLENT'
  workout_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wellness_daily_entry UNIQUE (user_id, entry_date)
);

-- 7. Personalization & Privacy Configuration
CREATE TABLE IF NOT EXISTS public.personalization_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level VARCHAR(30) DEFAULT 'STANDARD' NOT NULL, -- 'MINIMAL' | 'STANDARD' | 'DEEP'
  use_calendar_patterns BOOLEAN DEFAULT TRUE NOT NULL,
  use_learning_patterns BOOLEAN DEFAULT TRUE NOT NULL,
  use_finance_context BOOLEAN DEFAULT TRUE NOT NULL,
  use_wellness_context BOOLEAN DEFAULT FALSE NOT NULL,
  auto_memory_candidates BOOLEAN DEFAULT TRUE NOT NULL,
  recommendation_frequency VARCHAR(20) DEFAULT 'NORMAL' NOT NULL, -- 'LOW' | 'NORMAL' | 'HIGH'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_settings ENABLE ROW LEVEL SECURITY;

-- Owner Isolation Policies
CREATE POLICY "Users access own knowledge_entities" ON public.knowledge_entities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own knowledge_edges" ON public.knowledge_edges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own decisions" ON public.decisions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own habit_completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own routines" ON public.routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own routine_runs" ON public.routine_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own user_patterns" ON public.user_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recommendations" ON public.recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own recommendation_feedback" ON public.recommendation_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own wellness_entries" ON public.wellness_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own personalization_settings" ON public.personalization_settings FOR ALL USING (auth.uid() = user_id);
