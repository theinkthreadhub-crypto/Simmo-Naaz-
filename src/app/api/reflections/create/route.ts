import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addXPServer, updatePlayerStatServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const {
      sourceType,
      sourceId,
      whatWentWell,
      whatWasDifficult,
      whatDidYouLearn,
      whatWillYouChange,
      convertToMemory
    } = await request.json();

    if (!whatWentWell?.trim() || !whatDidYouLearn?.trim()) {
      return NextResponse.json({ error: 'Reflection fields "What went well" and "What did you learn" are required.' }, { status: 400 });
    }

    let memoryId: string | null = null;

    // Optional Convert to Memory Vault
    if (convertToMemory) {
      const { data: mem } = await supabase.from('memories').insert({
        user_id: user.id,
        type: 'LearningInsight',
        title: `Reflection Lesson: ${whatDidYouLearn.slice(0, 60)}`,
        content: `What went well: ${whatWentWell}\nDifficulties: ${whatWasDifficult || 'None'}\nLesson: ${whatDidYouLearn}\nNext iteration: ${whatWillYouChange || 'Continue execution'}`,
        source: sourceType || 'Action Reflection',
        source_id: sourceId || null,
        importance: 'HIGH',
        tags: ['Reflection', 'LearningInsight']
      }).select().single();

      if (mem) memoryId = mem.id;
    }

    // Save reflection
    const { data: reflection, error: refErr } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        source_type: sourceType || 'QUEST',
        source_id: sourceId || null,
        what_went_well: whatWentWell.trim(),
        what_was_difficult: whatWasDifficult?.trim() || '',
        what_did_you_learn: whatDidYouLearn.trim(),
        what_will_you_change: whatWillYouChange?.trim() || '',
        converted_to_memory: !!convertToMemory,
        memory_id: memoryId
      })
      .select()
      .single();

    if (refErr || !reflection) {
      return NextResponse.json({ error: refErr?.message || 'Failed to save reflection' }, { status: 500 });
    }

    // Award Reflection Bonus XP
    const xpResult = await addXPServer(
      user.id,
      35,
      'JOURNAL',
      reflection.id,
      `Action Reflection logged for ${sourceType || 'Quest'}`
    );

    await updatePlayerStatServer(user.id, 'knowledge', 1);

    return NextResponse.json({
      success: true,
      reflection,
      xpResult
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
