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

    const { objectiveId, bossMissionId } = await request.json();

    if (!objectiveId || !bossMissionId) {
      return NextResponse.json({ error: 'Missing objectiveId or bossMissionId' }, { status: 400 });
    }

    // 1. Fetch Objective
    const { data: objective } = await supabase
      .from('boss_objectives')
      .select('*')
      .eq('id', objectiveId)
      .eq('user_id', user.id)
      .single();

    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    const newCompleted = !objective.completed;

    // 2. Toggle status
    await supabase
      .from('boss_objectives')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', objectiveId)
      .eq('user_id', user.id);

    // 3. Check if all mandatory objectives for this Boss Mission are completed
    const { data: allObjs } = await supabase
      .from('boss_objectives')
      .select('*')
      .eq('boss_mission_id', bossMissionId)
      .eq('user_id', user.id);

    const mandatoryObjs = (allObjs || []).filter(o => o.is_mandatory);
    const allMandatoryDone = mandatoryObjs.length > 0 && mandatoryObjs.every(o => o.id === objectiveId ? newCompleted : o.completed);

    let bossCompleted = false;
    let bossXpResult = null;

    if (allMandatoryDone) {
      const { data: bossMission } = await supabase
        .from('boss_missions')
        .select('*')
        .eq('id', bossMissionId)
        .eq('user_id', user.id)
        .single();

      if (bossMission && bossMission.status !== 'COMPLETED') {
        await supabase
          .from('boss_missions')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          })
          .eq('id', bossMissionId);

        bossCompleted = true;

        // Huge XP Reward for Boss completion
        bossXpResult = await addXPServer(
          user.id,
          bossMission.reward_xp || 500,
          'BOSS_MISSION',
          bossMission.id,
          `DEFEATED BOSS MISSION: ${bossMission.title}`,
          bossMission.skill_id
        );

        // Update communication and discipline stats
        await updatePlayerStatServer(user.id, 'communication', 10);
        await updatePlayerStatServer(user.id, 'discipline', 10);

        // Unlock achievement
        await supabase.from('achievements').insert({
          user_id: user.id,
          title: 'Vocal Vanguard: Live Stage Boss Defeated',
          description: `Conquered Boss Challenge: "${bossMission.title}"`,
          icon: 'Trophy'
        });
      }
    }

    return NextResponse.json({
      success: true,
      objectiveCompleted: newCompleted,
      bossCompleted,
      bossXpResult
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
