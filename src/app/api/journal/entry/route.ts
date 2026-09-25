import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addXPServer, updatePlayerStatServer } from '@/lib/progression/playerProgression';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Session required.' }, { status: 401 });
    }

    const { 
      content, 
      mood, 
      wins, 
      problems, 
      decisions, 
      ideas,
      lessons,
      tomorrowActions,
      tags,
      convertToMemories,
      convertActionsToQuests
    } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    // 1. Insert journal entry
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        content,
        title: content.slice(0, 80) + (content.length > 80 ? '...' : ''),
        mood: mood || 'PRODUCTIVE',
        wins: wins || [],
        problems: problems || [],
        decisions: decisions || [],
        ideas: ideas || [],
        lessons: lessons || [],
        tomorrow_actions: tomorrowActions || [],
        tags: tags || ['DailyLog', 'Reflection'],
        entry_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Convert Decisions/Ideas to Memories if requested
    if (convertToMemories) {
      if (decisions && Array.isArray(decisions)) {
        for (const dec of decisions) {
          if (dec.trim()) {
            await supabase.from('memories').insert({
              user_id: user.id,
              type: 'DECISION',
              title: `Strategic Decision: ${dec.slice(0, 60)}`,
              content: dec,
              source: 'Journal Reflection',
              source_id: entry.id,
              importance: 'HIGH',
              tags: ['Decision', 'Journal']
            });
          }
        }
      }
      if (ideas && Array.isArray(ideas)) {
        for (const idea of ideas) {
          if (idea.trim()) {
            await supabase.from('memories').insert({
              user_id: user.id,
              type: 'IDEA',
              title: `Insight/Idea: ${idea.slice(0, 60)}`,
              content: idea,
              source: 'Journal Reflection',
              source_id: entry.id,
              importance: 'MEDIUM',
              tags: ['Idea', 'ProjectSeed']
            });
          }
        }
      }
    }

    // 3. Convert Tomorrow Actions to Daily Quests if requested
    if (convertActionsToQuests && tomorrowActions && Array.isArray(tomorrowActions)) {
      for (const act of tomorrowActions) {
        if (act.trim()) {
          await supabase.from('quests').insert({
            user_id: user.id,
            title: act.trim(),
            description: `Planned in journal reflection on ${new Date().toLocaleDateString()}`,
            category: 'PERSONAL_GROWTH',
            type: 'DAILY',
            difficulty: 'MEDIUM',
            xp_reward: 80,
            skill_xp_reward: 30,
            priority: 'HIGH',
            status: 'ACTIVE',
            progress_percent: 0,
            required_action: 'Execute planned daily action'
          });
        }
      }
    }

    // 4. Award reflection XP (60 XP) securely with ledger transaction
    const xpResult = await addXPServer(
      user.id,
      60,
      'JOURNAL',
      entry.id,
      'Daily reflection journal saved'
    );

    // 5. Increment Discipline stat
    await updatePlayerStatServer(user.id, 'discipline', 2);

    // 6. Record in activity log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'JOURNAL_SAVED',
      module: 'JOURNAL',
      details: {
        entry_id: entry.id,
        xp_awarded: 60,
        mood: entry.mood
      }
    });

    return NextResponse.json({ 
      success: true, 
      entry, 
      xpResult 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
