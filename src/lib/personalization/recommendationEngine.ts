import { createClient } from '@/lib/supabase/server';
import { detectBehavioralPatterns } from './patternEngine';

export interface SovereignRecommendation {
  id: string;
  userId: string;
  type: 'NEXT_QUEST' | 'LEARNING_NUDGE' | 'ROUTINE_ADJUST' | 'FINANCE_REVIEW' | 'PROJECT_ACTION';
  title: string;
  reason: string;
  evidence: Record<string, unknown>;
  confidence: number;
  actionPayload: Record<string, unknown>;
  status: 'NEW' | 'VIEWED' | 'ACCEPTED' | 'DISMISSED';
  createdAt: string;
}

export async function generatePersonalizedRecommendations(userId: string): Promise<SovereignRecommendation[]> {
  const supabase = createClient();
  const recommendations: SovereignRecommendation[] = [];

  try {
    const patterns = await detectBehavioralPatterns(userId);

    // 1. Check if user has evening learning pattern and pending speech session
    const eveningPattern = patterns.find(p => p.patternType === 'LEARNING_WINDOW');
    if (eveningPattern) {
      recommendations.push({
        id: `rec_learn_evening_${userId}`,
        userId,
        type: 'LEARNING_NUDGE',
        title: 'Schedule Public Speaking Practice for 8:00 PM',
        reason: 'Your past sessions show peak focus in the evening window.',
        evidence: eveningPattern.evidence,
        confidence: eveningPattern.confidence,
        actionPayload: { skillId: 'public_speaking', suggestedTime: '20:00' },
        status: 'NEW',
        createdAt: new Date().toISOString()
      });
    }

    // 2. Check for active projects without next actions
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, next_action')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .limit(3);

    for (const proj of (projects || [])) {
      if (!proj.next_action || proj.next_action === 'Establish initial milestone quests') {
        recommendations.push({
          id: `rec_proj_action_${proj.id}`,
          userId,
          type: 'PROJECT_ACTION',
          title: `Define next strategic action for ${proj.title}`,
          reason: 'Active project requires clear immediate operational focus.',
          evidence: { projectId: proj.id, currentNextAction: proj.next_action },
          confidence: 0.9,
          actionPayload: { projectId: proj.id },
          status: 'NEW',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Persist to recommendations table
    for (const rec of recommendations) {
      await supabase.from('recommendations').upsert({
        id: rec.id,
        user_id: userId,
        type: rec.type,
        title: rec.title,
        reason: rec.reason,
        evidence: rec.evidence,
        confidence: rec.confidence,
        action_payload: rec.actionPayload,
        status: 'NEW',
        created_at: rec.createdAt
      }, { onConflict: 'id' });
    }

    return recommendations;
  } catch {
    return [];
  }
}

export async function submitRecommendationFeedback(
  userId: string,
  recommendationId: string,
  action: 'ACCEPTED' | 'DISMISSED' | 'HELPFUL' | 'NOT_HELPFUL',
  feedbackReason?: string
): Promise<boolean> {
  const supabase = createClient();
  try {
    await supabase.from('recommendation_feedback').insert({
      recommendation_id: recommendationId,
      user_id: userId,
      action,
      feedback_reason: feedbackReason || null
    });

    await supabase
      .from('recommendations')
      .update({ status: action === 'DISMISSED' ? 'DISMISSED' : 'ACCEPTED' })
      .eq('id', recommendationId)
      .eq('user_id', userId);

    return true;
  } catch {
    return false;
  }
}
