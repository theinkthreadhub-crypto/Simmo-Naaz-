import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addXPServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { lessonId, skillId, xpReward, skillXpReward } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId parameter.' }, { status: 400 });
    }

    // 1. Mark lesson completed
    await supabase
      .from('skill_lessons')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .eq('user_id', user.id);

    // 2. Award XP securely
    const playerXp = Number(xpReward) || 40;
    const skillXp = Number(skillXpReward) || 25;

    const xpResult = await addXPServer(
      user.id,
      playerXp,
      'SKILL_LESSON',
      lessonId,
      `Completed skill lesson: ${lessonId}`,
      skillId
    );

    // 3. Update User Skill XP
    if (skillId) {
      const { data: userSkill } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
        .single();

      if (userSkill) {
        let newXp = (userSkill.xp || 0) + skillXp;
        let newLevel = userSkill.level || 1;
        const threshold = newLevel * 300;
        if (newXp >= threshold) {
          newLevel += 1;
          newXp -= threshold;
        }

        await supabase.from('user_skills').update({
          xp: newXp,
          level: newLevel,
          updated_at: new Date().toISOString()
        }).eq('id', userSkill.id);
      }
    }

    return NextResponse.json({
      success: true,
      xpResult
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
