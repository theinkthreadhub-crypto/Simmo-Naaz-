import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { saveLearningProfile, initializePublicSpeakingRoadmap } from '@/lib/db/learning';
import { addXPServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Operator session required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      skillName,
      whyLearn,
      currentExperience,
      targetGoal,
      timeAvailableMins,
      targetDate,
      preferredLanguage,
      learningPreference,
      mainDifficulty
    } = body;

    if (!skillName) {
      return NextResponse.json({ error: 'Missing skillName parameter.' }, { status: 400 });
    }

    const skillId = skillName.toLowerCase().includes('public') 
      ? 'skill_public_speaking' 
      : `skill_${skillName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // 1. Save Learning Profile
    const profile = await saveLearningProfile({
      user_id: user.id,
      skill_id: skillId,
      why_learn: whyLearn || 'Skill advancement',
      current_experience: currentExperience || 'Beginner',
      target_goal: targetGoal || 'Demonstrate mastery in high-stakes environments',
      time_available_mins: Number(timeAvailableMins) || 15,
      target_date: targetDate || null,
      preferred_language: preferredLanguage || 'Both (Hindi + English)',
      learning_preference: learningPreference || 'Practical Execution',
      main_difficulty: mainDifficulty || 'Nervousness',
      current_weaknesses: [mainDifficulty || 'Initial hesitation'],
      current_strengths: ['Drive to master competency'],
      baseline_completed: false
    });

    // 2. Initialize or fetch Roadmap
    let roadmap;
    if (skillId === 'skill_public_speaking') {
      roadmap = await initializePublicSpeakingRoadmap(user.id);
    } else {
      // Generic Adaptive Roadmap for any skill (Python, Sales, Negotiation, etc.)
      const { data: rm } = await supabase
        .from('skill_roadmaps')
        .upsert({
          user_id: user.id,
          skill_id: skillId,
          title: `Adaptive Roadmap: ${skillName}`,
          total_modules: 4,
          completed_modules: 0,
          completion_percent: 0,
          current_level: 1,
          target_level: 10,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      roadmap = rm;
    }

    // 3. Ensure User Skill row exists
    await supabase.from('user_skills').upsert({
      user_id: user.id,
      name: skillName,
      category: skillName.toLowerCase().includes('speaking') || skillName.toLowerCase().includes('communication') 
        ? 'COMMUNICATION' 
        : 'BUSINESS',
      level: 1,
      xp: 0,
      target_level: 10,
      status: 'ACTIVE',
      updated_at: new Date().toISOString()
    });

    // 4. Award initial skill onboarding XP
    await addXPServer(
      user.id,
      50,
      'SKILL_LESSON',
      `onboard_${skillId}`,
      `Initiated adaptive skill trajectory: ${skillName}`,
      skillId
    );

    // 5. Activity Log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'SKILL_STARTED',
      module: 'SKILLS',
      details: {
        skillName,
        skillId,
        whyLearn
      }
    });

    return NextResponse.json({
      success: true,
      skillId,
      profile,
      roadmap
    });

  } catch (err: any) {
    console.error('[SKILL ONBOARD ERR]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
