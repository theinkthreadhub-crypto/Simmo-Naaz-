import { createClient } from '@/lib/supabase/server';

export interface UserPattern {
  id: string;
  userId: string;
  patternType: 'TIME_PREFERENCE' | 'TASK_DURATION' | 'LEARNING_WINDOW' | 'ROUTINE_COMPLETION' | 'NOTIFICATION_INTERACTION';
  title: string;
  description: string;
  confidence: number;
  evidence: Record<string, unknown>;
  lastObservedAt: string;
}

export async function detectBehavioralPatterns(userId: string): Promise<UserPattern[]> {
  const supabase = createClient();
  const patterns: UserPattern[] = [];

  try {
    // 1. Analyze Public Speaking / Learning session timestamps
    const { data: practices } = await supabase
      .from('voice_practices')
      .select('created_at')
      .eq('user_id', userId)
      .limit(20);

    if (practices && practices.length >= 3) {
      const eveningSessions = practices.filter((p: any) => {
        const hour = new Date(p.created_at).getHours();
        return hour >= 18 && hour <= 23;
      }).length;

      const eveningRatio = eveningSessions / practices.length;
      if (eveningRatio >= 0.6) {
        patterns.push({
          id: `pat_learning_evening_${userId}`,
          userId,
          patternType: 'LEARNING_WINDOW',
          title: 'Evening Skill Practice Preference',
          description: `You frequently complete speech and learning sessions between 6:00 PM and 11:00 PM (${Math.round(eveningRatio * 100)}% of recent sessions).`,
          confidence: Math.min(eveningRatio, 0.95),
          evidence: {
            totalSessionsAnalyzed: practices.length,
            eveningSessionsCount: eveningSessions,
            eveningPercentage: Math.round(eveningRatio * 100)
          },
          lastObservedAt: new Date().toISOString()
        });
      }
    }

    // 2. Analyze Quest Completion Cadence
    const { data: quests } = await supabase
      .from('quests')
      .select('difficulty, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .limit(15);

    if (quests && quests.length >= 4) {
      patterns.push({
        id: `pat_quest_pace_${userId}`,
        userId,
        patternType: 'TASK_DURATION',
        title: 'Consistent Daily Quest Execution',
        description: 'You maintain strong velocity on daily quests with high completion ratios.',
        confidence: 0.85,
        evidence: { completedQuestsSampled: quests.length },
        lastObservedAt: new Date().toISOString()
      });
    }

    // Persist pattern candidates
    for (const pat of patterns) {
      await supabase.from('user_patterns').upsert({
        id: pat.id,
        user_id: userId,
        pattern_type: pat.patternType,
        title: pat.title,
        description: pat.description,
        confidence: pat.confidence,
        evidence: pat.evidence,
        last_observed_at: pat.lastObservedAt
      }, { onConflict: 'id' });
    }

    return patterns;
  } catch {
    return [];
  }
}
