-- ==============================================================================
-- MENTRA PHASE 3: ADAPTIVE SKILL LEARNING ENGINE & LIFE RPG PRODUCTION SCHEMA
-- ==============================================================================

-- 1. Learning Profiles
CREATE TABLE IF NOT EXISTS public.learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  why_learn TEXT NOT NULL,
  current_experience TEXT NOT NULL,
  target_goal TEXT NOT NULL,
  time_available_mins INT DEFAULT 15,
  target_date DATE,
  preferred_language TEXT DEFAULT 'Both (Hindi + English)',
  learning_preference TEXT DEFAULT 'Practical Execution',
  main_difficulty TEXT,
  current_weaknesses TEXT[] DEFAULT '{}',
  current_strengths TEXT[] DEFAULT '{}',
  baseline_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- 2. Skill Roadmaps
CREATE TABLE IF NOT EXISTS public.skill_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  title TEXT NOT NULL,
  total_modules INT DEFAULT 0,
  completed_modules INT DEFAULT 0,
  completion_percent INT DEFAULT 0,
  current_level INT DEFAULT 1,
  target_level INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skill Modules
CREATE TABLE IF NOT EXISTS public.skill_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES public.skill_roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 1,
  required_level INT DEFAULT 1,
  estimated_duration TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Skill Lessons
CREATE TABLE IF NOT EXISTS public.skill_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.skill_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  concept_summary TEXT NOT NULL,
  demonstration_example TEXT,
  framework_steps JSONB DEFAULT '[]'::jsonb,
  order_index INT DEFAULT 1,
  xp_reward INT DEFAULT 30,
  skill_xp_reward INT DEFAULT 20,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skill Exercises
CREATE TABLE IF NOT EXISTS public.skill_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.skill_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  exercise_type TEXT NOT NULL DEFAULT 'SPEAKING_OR_TEXT' CHECK (exercise_type IN ('SPEAKING_OR_TEXT', 'AUDIO_RECORD', 'TEXT_PRACTICE', 'TIMED_CHALLENGE', 'REAL_WORLD')),
  duration_seconds INT DEFAULT 60,
  xp_reward INT DEFAULT 45,
  skill_xp_reward INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Practice Attempts & Audio Assessments
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  exercise_id TEXT,
  attempt_number INT DEFAULT 1,
  transcript TEXT,
  audio_url TEXT,
  duration_seconds INT DEFAULT 0,
  self_rating INT DEFAULT 3,
  metrics JSONB DEFAULT '{
    "estimated_words": 0,
    "speaking_rate_wpm": 0,
    "pause_count": 0,
    "long_pauses": 0,
    "filler_words_count": 0,
    "repeated_words_count": 0
  }'::jsonb,
  feedback JSONB DEFAULT '{
    "clarity_feedback": "",
    "structure_feedback": "",
    "opening_feedback": "",
    "closing_feedback": "",
    "strengths": [],
    "improvements": [],
    "next_focus": "",
    "ai_analysis_status": "PENDING_OR_MANUAL"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Boss Missions
CREATE TABLE IF NOT EXISTS public.boss_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_xp INT DEFAULT 500,
  reward_skill_xp INT DEFAULT 150,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Boss Objectives
CREATE TABLE IF NOT EXISTS public.boss_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_mission_id UUID NOT NULL REFERENCES public.boss_missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Post-Action Reflections
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('QUEST', 'BOSS_MISSION', 'DAILY', 'SKILL_MILESTONE')),
  source_id TEXT,
  what_went_well TEXT NOT NULL,
  what_was_difficult TEXT,
  what_did_you_learn TEXT NOT NULL,
  what_will_you_change TEXT,
  converted_to_memory BOOLEAN DEFAULT FALSE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Reconcile XP Transactions table columns
ALTER TABLE public.xp_transactions ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS goal_id TEXT;

-- 11. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 12. Create Strict Owner-Only Policies
CREATE POLICY "learning_profiles_owner_all" ON public.learning_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_roadmaps_owner_all" ON public.skill_roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_modules_owner_all" ON public.skill_modules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_lessons_owner_all" ON public.skill_lessons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skill_exercises_owner_all" ON public.skill_exercises FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "practice_attempts_owner_all" ON public.practice_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "boss_missions_owner_all" ON public.boss_missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "boss_objectives_owner_all" ON public.boss_objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reflections_owner_all" ON public.reflections FOR ALL USING (auth.uid() = user_id);
