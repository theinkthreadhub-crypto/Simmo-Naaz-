import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePersonalizedRecommendations, submitRecommendationFeedback } from '@/lib/personalization/recommendationEngine';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const recommendations = await generatePersonalizedRecommendations(user.id);
  return NextResponse.json({ success: true, recommendations });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recommendationId, action, feedbackReason } = body;

    if (!recommendationId || !action) {
      return NextResponse.json({ success: false, error: 'RECOMMENDATION_ID_AND_ACTION_REQUIRED' }, { status: 400 });
    }

    const success = await submitRecommendationFeedback(user.id, recommendationId, action, feedbackReason);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
