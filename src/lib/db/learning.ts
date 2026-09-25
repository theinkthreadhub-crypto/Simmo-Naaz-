import { supabase } from '@/lib/supabase/client';
import { 
  LearningProfile, 
  SkillRoadmap, 
  SkillModule, 
  SkillLesson, 
  PracticeAttempt, 
  BossMission, 
  Reflection 
} from '@/types/mentra';
import { 
  PUBLIC_SPEAKING_SKILL_ID, 
  PUBLIC_SPEAKING_CURRICULUM 
} from '@/lib/learning/publicSpeakingCurriculum';

export async function getLearningProfile(userId: string, skillId: string): Promise<LearningProfile | null> {
  const { data, error } = await supabase
    .from('learning_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .single();

  if (error || !data) return null;
  return data as LearningProfile;
}

export async function saveLearningProfile(profile: Partial<LearningProfile> & { user_id: string; skill_id: string }): Promise<LearningProfile | null> {
  const { data, error } = await supabase
    .from('learning_profiles')
    .upsert({
      user_id: profile.user_id,
      skill_id: profile.skill_id,
      why_learn: profile.why_learn || 'Skill mastery for career and life advancement',
      current_experience: profile.current_experience || 'Beginner',
      target_goal: profile.target_goal || 'Confidently deliver high-stakes presentations',
      time_available_mins: profile.time_available_mins || 15,
      target_date: profile.target_date || null,
      preferred_language: profile.preferred_language || 'Both (Hindi + English)',
      learning_preference: profile.learning_preference || 'Practical Execution',
      main_difficulty: profile.main_difficulty || 'Nervousness & Filler Words',
      current_weaknesses: profile.current_weaknesses || ['Filler words', 'Speaking pace'],
      current_strengths: profile.current_strengths || ['Enthusiasm', 'Subject knowledge'],
      baseline_completed: profile.baseline_completed ?? false,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    console.warn('[LEARNING DB]: Failed to upsert learning profile:', error);
    return null;
  }
  return data as LearningProfile;
}

export async function getSkillRoadmapWithModules(userId: string, skillId: string): Promise<SkillRoadmap | null> {
  const { data: roadmap, error: rErr } = await supabase
    .from('skill_roadmaps')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .single();

  if (rErr || !roadmap) {
    // If not in database yet, initialize standard curriculum for Public Speaking
    if (skillId === PUBLIC_SPEAKING_SKILL_ID) {
      return initializePublicSpeakingRoadmap(userId);
    }
    return null;
  }

  // Fetch modules
  const { data: modules } = await supabase
    .from('skill_modules')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('order_index', { ascending: true });

  const modulesWithLessons = await Promise.all((modules || []).map(async (mod) => {
    const { data: lessons } = await supabase
      .from('skill_lessons')
      .select('*')
      .eq('module_id', mod.id)
      .order('order_index', { ascending: true });

    const lessonsWithExercises = await Promise.all((lessons || []).map(async (les) => {
      const { data: exercises } = await supabase
        .from('skill_exercises')
        .select('*')
        .eq('lesson_id', les.id);
      return {
        ...les,
        exercises: exercises || []
      };
    }));

    return {
      ...mod,
      lessons: lessonsWithExercises
    };
  }));

  return {
    ...roadmap,
    modules: modulesWithLessons
  };
}

export async function initializePublicSpeakingRoadmap(userId: string): Promise<SkillRoadmap> {
  const totalModulesCount = PUBLIC_SPEAKING_CURRICULUM.modules.length;

  // 1. Create Roadmap
  const { data: roadmap } = await supabase
    .from('skill_roadmaps')
    .upsert({
      user_id: userId,
      skill_id: PUBLIC_SPEAKING_SKILL_ID,
      title: 'Mastery Path: Executive Public Speaking & Rhetoric',
      total_modules: totalModulesCount,
      completed_modules: 0,
      completion_percent: 0,
      current_level: 1,
      target_level: 10,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  const roadmapId = roadmap?.id || `rm_ps_${userId.slice(0, 6)}`;

  // 2. Insert or map modules & lessons
  const builtModules = [];
  for (let mIdx = 0; mIdx < PUBLIC_SPEAKING_CURRICULUM.modules.length; mIdx++) {
    const mData = PUBLIC_SPEAKING_CURRICULUM.modules[mIdx];
    const { data: mod } = await supabase
      .from('skill_modules')
      .insert({
        roadmap_id: roadmapId,
        user_id: userId,
        title: mData.title,
        description: mData.description,
        order_index: mData.order_index,
        required_level: mData.required_level,
        estimated_duration: mData.estimated_duration,
        completed: false
      })
      .select()
      .single();

    const moduleId = mod?.id || `mod_${mIdx}_${userId.slice(0, 6)}`;
    const builtLessons = [];

    for (let lIdx = 0; lIdx < mData.lessons.length; lIdx++) {
      const lData = mData.lessons[lIdx];
      const { data: les } = await supabase
        .from('skill_lessons')
        .insert({
          module_id: moduleId,
          user_id: userId,
          title: lData.title,
          concept_summary: lData.concept_summary,
          demonstration_example: lData.demonstration_example,
          framework_steps: lData.framework_steps,
          order_index: lData.order_index,
          xp_reward: lData.xp_reward,
          skill_xp_reward: lData.skill_xp_reward,
          completed: false
        })
        .select()
        .single();

      const lessonId = les?.id || `les_${mIdx}_${lIdx}_${userId.slice(0, 6)}`;
      const builtExercises = [];

      for (let eIdx = 0; eIdx < lData.exercises.length; eIdx++) {
        const eData = lData.exercises[eIdx];
        const { data: ex } = await supabase
          .from('skill_exercises')
          .insert({
            lesson_id: lessonId,
            user_id: userId,
            title: eData.title,
            prompt: eData.prompt,
            exercise_type: eData.exercise_type,
            duration_seconds: eData.duration_seconds,
            xp_reward: eData.xp_reward,
            skill_xp_reward: eData.skill_xp_reward
          })
          .select()
          .single();

        builtExercises.push(ex || {
          id: `ex_${mIdx}_${lIdx}_${eIdx}`,
          lesson_id: lessonId,
          user_id: userId,
          ...eData
        });
      }

      builtLessons.push({
        id: lessonId,
        module_id: moduleId,
        user_id: userId,
        title: lData.title,
        concept_summary: lData.concept_summary,
        demonstration_example: lData.demonstration_example,
        framework_steps: lData.framework_steps,
        order_index: lData.order_index,
        xp_reward: lData.xp_reward,
        skill_xp_reward: lData.skill_xp_reward,
        completed: false,
        exercises: builtExercises
      });
    }

    builtModules.push({
      id: moduleId,
      roadmap_id: roadmapId,
      user_id: userId,
      title: mData.title,
      description: mData.description,
      order_index: mData.order_index,
      required_level: mData.required_level,
      estimated_duration: mData.estimated_duration,
      completed: false,
      lessons: builtLessons
    });
  }

  // 3. Insert Boss Mission
  const bmData = PUBLIC_SPEAKING_CURRICULUM.bossMission;
  const { data: boss } = await supabase
    .from('boss_missions')
    .insert({
      user_id: userId,
      skill_id: PUBLIC_SPEAKING_SKILL_ID,
      title: bmData.title,
      description: bmData.description,
      reward_xp: bmData.reward_xp,
      reward_skill_xp: bmData.reward_skill_xp,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (boss) {
    for (const obj of bmData.objectives) {
      await supabase.from('boss_objectives').insert({
        boss_mission_id: boss.id,
        user_id: userId,
        title: obj.title,
        is_mandatory: obj.is_mandatory,
        completed: false
      });
    }
  }

  return {
    id: roadmapId,
    user_id: userId,
    skill_id: PUBLIC_SPEAKING_SKILL_ID,
    title: 'Mastery Path: Executive Public Speaking & Rhetoric',
    total_modules: totalModulesCount,
    completed_modules: 0,
    completion_percent: 0,
    current_level: 1,
    target_level: 10,
    modules: builtModules
  };
}

export async function recordPracticeAttempt(attempt: Partial<PracticeAttempt> & { user_id: string; skill_id: string }): Promise<PracticeAttempt | null> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .insert({
      user_id: attempt.user_id,
      skill_id: attempt.skill_id,
      exercise_id: attempt.exercise_id || null,
      attempt_number: attempt.attempt_number || 1,
      transcript: attempt.transcript || '',
      audio_url: attempt.audio_url || null,
      duration_seconds: attempt.duration_seconds || 0,
      self_rating: attempt.self_rating || 4,
      metrics: attempt.metrics || {},
      feedback: attempt.feedback || {}
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[PRACTICE ATTEMPT ERR]:', error);
    return null;
  }

  return data as PracticeAttempt;
}

export async function getPracticeAttempts(userId: string, skillId: string): Promise<PracticeAttempt[]> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as PracticeAttempt[];
}

export async function getBossMissions(userId: string, skillId?: string): Promise<BossMission[]> {
  let query = supabase.from('boss_missions').select('*').eq('user_id', userId);
  if (skillId) {
    query = query.eq('skill_id', skillId);
  }
  const { data: missions, error } = await query;
  if (error || !missions) return [];

  const withObjectives = await Promise.all(missions.map(async (m) => {
    const { data: objs } = await supabase
      .from('boss_objectives')
      .select('*')
      .eq('boss_mission_id', m.id);
    return {
      ...m,
      objectives: objs || []
    };
  }));

  return withObjectives as BossMission[];
}

export async function saveReflection(reflection: Partial<Reflection> & { user_id: string; what_went_well: string; what_did_you_learn: string }): Promise<Reflection | null> {
  const { data, error } = await supabase
    .from('reflections')
    .insert({
      user_id: reflection.user_id,
      source_type: reflection.source_type || 'QUEST',
      source_id: reflection.source_id || null,
      what_went_well: reflection.what_went_well,
      what_was_difficult: reflection.what_was_difficult || '',
      what_did_you_learn: reflection.what_did_you_learn,
      what_will_you_change: reflection.what_will_you_change || '',
      converted_to_memory: false
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as Reflection;
}
