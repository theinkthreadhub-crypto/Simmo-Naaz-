import { createClient } from '@/lib/supabase/server';

export type FeedbackRating =
  | 'HELPFUL'
  | 'NOT_HELPFUL'
  | 'EXCELLENT'
  | 'WRONG_FACT'
  | 'TOO_LONG'
  | 'TOO_SHORT'
  | 'BAD_TIMING'
  | 'ALREADY_DONE';

export interface UserFeedbackEntry {
  id: string;
  userId: string;
  feature: string;
  responseId?: string;
  conversationId?: string;
  agentRunId?: string;
  recommendationId?: string;
  rating: FeedbackRating;
  reason?: string;
  optionalComment?: string;
  createdAt: string;
}

const memFeedback: UserFeedbackEntry[] = [];

/**
 * Records user feedback for a specific feature, recommendation, or AI response.
 */
export async function submitUserFeedback(
  userId: string,
  feedback: {
    feature: string;
    responseId?: string;
    conversationId?: string;
    agentRunId?: string;
    recommendationId?: string;
    rating: FeedbackRating;
    reason?: string;
    optionalComment?: string;
  }
): Promise<{ success: boolean; id: string }> {
  const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const entry: UserFeedbackEntry = {
    id,
    userId,
    feature: feedback.feature,
    responseId: feedback.responseId,
    conversationId: feedback.conversationId,
    agentRunId: feedback.agentRunId,
    recommendationId: feedback.recommendationId,
    rating: feedback.rating,
    reason: feedback.reason,
    optionalComment: feedback.optionalComment,
    createdAt: new Date().toISOString()
  };

  memFeedback.push(entry);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('user_feedback').insert({
        id,
        user_id: userId,
        feature: entry.feature,
        response_id: entry.responseId || null,
        conversation_id: entry.conversationId || null,
        agent_run_id: entry.agentRunId || null,
        recommendation_id: entry.recommendationId || null,
        rating: entry.rating,
        reason: entry.reason || null,
        optional_comment: entry.optionalComment || null,
        created_at: entry.createdAt
      })
    ).catch(() => {});
  } catch {
    // In-memory fallback
  }

  return { success: true, id };
}

/**
 * Retrieves aggregate feedback metrics for a user or feature.
 */
export async function getFeedbackSummary(userId: string, feature?: string): Promise<{
  totalCount: number;
  helpfulCount: number;
  negativeCount: number;
  topReasons: Record<string, number>;
}> {
  const relevant = memFeedback.filter(
    f => f.userId === userId && (!feature || f.feature === feature)
  );

  let helpfulCount = 0;
  let negativeCount = 0;
  const topReasons: Record<string, number> = {};

  for (const f of relevant) {
    if (f.rating === 'HELPFUL' || f.rating === 'EXCELLENT') {
      helpfulCount++;
    } else {
      negativeCount++;
    }
    if (f.reason) {
      topReasons[f.reason] = (topReasons[f.reason] || 0) + 1;
    }
  }

  return {
    totalCount: relevant.length,
    helpfulCount,
    negativeCount,
    topReasons
  };
}

export function getInMemoryFeedback(): UserFeedbackEntry[] {
  return memFeedback;
}
