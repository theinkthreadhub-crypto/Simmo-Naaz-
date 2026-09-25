import { NextResponse, type NextRequest } from 'next/server';
import { submitUserFeedback, getFeedbackSummary } from '@/lib/feedback/feedbackEngine';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const body = await request.json();
    if (!body.feature || !body.rating) {
      return NextResponse.json({ error: 'Feature and rating are required.' }, { status: 400 });
    }

    const res = await submitUserFeedback(userId, body);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  const { searchParams } = new URL(request.url);
  const feature = searchParams.get('feature') || undefined;

  const summary = await getFeedbackSummary(userId, feature);
  return NextResponse.json(summary);
}
