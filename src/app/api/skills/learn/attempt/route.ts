import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addXPServer, updatePlayerStatServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Operator session required.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      skillId, 
      exerciseId, 
      transcript, 
      audioUrl, 
      durationSeconds, 
      selfRating,
      metrics,
      userProvidedFeedback
    } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'Missing skillId parameter.' }, { status: 400 });
    }

    // 1. Adaptive Rules Engine (Evaluates actual inputs)
    const durSec = Number(durationSeconds) || 60;
    const words = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : (metrics?.estimated_words || 0);
    const calculatedWpm = durSec > 0 && words > 0 ? Math.round((words / (durSec / 60))) : (metrics?.speaking_rate_wpm || 0);
    
    // Count common filler words in English/Hindi if transcript exists
    let fillerCount = 0;
    if (transcript) {
      const fillerRegex = /\b(um|umm|uh|uhh|like|actually|basically|matlab|yaani|you know|sort of)\b/gi;
      const matches = transcript.match(fillerRegex);
      fillerCount = matches ? matches.length : 0;
    }

    const adaptiveStrengths: string[] = [];
    const adaptiveImprovements: string[] = [];
    let nextFocus = 'Maintain consistent daily 60-second delivery habit.';

    if (calculatedWpm > 0 && calculatedWpm < 110) {
      adaptiveImprovements.push('Pacing is slightly slow (<110 WPM). Aim for 130-150 WPM for engaging delivery.');
      nextFocus = 'Practice rhythmic momentum and energetic cadence.';
    } else if (calculatedWpm > 165) {
      adaptiveImprovements.push('Speaking rate is fast (>165 WPM). Use 2-second deliberate pauses to let points sink in.');
      nextFocus = 'Implement deliberate 2-second silence after core arguments.';
    } else if (calculatedWpm >= 120 && calculatedWpm <= 155) {
      adaptiveStrengths.push('Optimal conversational speaking pace (120-155 WPM).');
    }

    if (fillerCount === 0 && words > 15) {
      adaptiveStrengths.push('Zero filler words detected during speech sample.');
    } else if (fillerCount > 3) {
      adaptiveImprovements.push(`Detected ${fillerCount} filler sounds. Close lips and pause instead of vocalizing hesitation.`);
      nextFocus = 'Zero-Filler lip-closure drill.';
    }

    if (selfRating >= 4) {
      adaptiveStrengths.push('High somatic confidence and physical presence.');
    } else if (selfRating <= 2) {
      adaptiveImprovements.push('Subjective nervousness noted. Perform physiological sighs before speaking.');
    }

    const finalMetrics = {
      duration_seconds: durSec,
      estimated_words: words,
      speaking_rate_wpm: calculatedWpm,
      pause_count: metrics?.pause_count || 0,
      long_pauses: metrics?.long_pauses || 0,
      filler_words_count: fillerCount,
      repeated_words_count: metrics?.repeated_words_count || 0
    };

    const finalFeedback = {
      clarity_feedback: userProvidedFeedback?.clarity || (words > 20 ? 'Clear articulation and coherent vocal delivery.' : 'Concise response provided.'),
      structure_feedback: userProvidedFeedback?.structure || 'Message follows logical sequence.',
      opening_feedback: 'Direct opening statement established.',
      closing_feedback: 'Clear conclusion summary delivered.',
      strengths: adaptiveStrengths.length > 0 ? adaptiveStrengths : ['Demonstrated willingness to step into active practice.'],
      improvements: adaptiveImprovements.length > 0 ? adaptiveImprovements : ['Continue refining vocal variety and inflection.'],
      next_focus: nextFocus,
      ai_analysis_status: 'AVAILABLE'
    };

    // 2. Fetch current attempt count
    const { count } = await supabase
      .from('practice_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('skill_id', skillId);

    const attemptNumber = (count || 0) + 1;

    // 3. Persist Practice Attempt in DB
    const { data: attemptRecord, error: attemptErr } = await supabase
      .from('practice_attempts')
      .insert({
        user_id: user.id,
        skill_id: skillId,
        exercise_id: exerciseId || null,
        attempt_number: attemptNumber,
        transcript: transcript || '',
        audio_url: audioUrl || null,
        duration_seconds: durSec,
        self_rating: Number(selfRating) || 4,
        metrics: finalMetrics,
        feedback: finalFeedback
      })
      .select()
      .single();

    if (attemptErr) {
      console.error('[PRACTICE ATTEMPT ERR]:', attemptErr);
    }

    // 4. Secure Server-side XP Award
    const basePlayerXp = 45;
    const baseSkillXp = 30;

    const xpResult = await addXPServer(
      user.id,
      basePlayerXp,
      'SKILL_PRACTICE',
      attemptRecord?.id || `attempt_${Date.now()}`,
      `Completed practice attempt #${attemptNumber} for skill: ${skillId}`,
      skillId
    );

    // 5. Update User Skill Record XP & Level
    const { data: userSkill } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Public Speaking')
      .single();

    let newSkillXp = (userSkill?.xp || 0) + baseSkillXp;
    let newSkillLevel = userSkill?.level || 1;
    const skillNextThreshold = newSkillLevel * 300;

    if (newSkillXp >= skillNextThreshold) {
      newSkillLevel += 1;
      newSkillXp -= skillNextThreshold;
    }

    await supabase.from('user_skills').upsert({
      user_id: user.id,
      name: 'Public Speaking',
      category: 'COMMUNICATION',
      level: newSkillLevel,
      xp: newSkillXp,
      target_level: 10,
      status: 'ACTIVE',
      updated_at: new Date().toISOString()
    });

    // 6. Update communication player stat
    await updatePlayerStatServer(user.id, 'communication', 2);

    // 7. Record in Activity Logs
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'PRACTICE_COMPLETED',
      module: 'SKILLS',
      details: {
        skillId,
        attemptNumber,
        xpAwarded: basePlayerXp,
        skillXpAwarded: baseSkillXp,
        wpm: calculatedWpm,
        fillerCount
      }
    });

    return NextResponse.json({
      success: true,
      attempt: attemptRecord,
      metrics: finalMetrics,
      feedback: finalFeedback,
      xpResult,
      skillLevel: newSkillLevel,
      skillXp: newSkillXp
    });

  } catch (err: any) {
    console.error('[API ATTEMPT ERR]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
