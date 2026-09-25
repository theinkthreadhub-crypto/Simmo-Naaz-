import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateSpeakingAttempt, getSpeakingHistory } from '@/lib/speech/voiceCoach';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const history = await getSpeakingHistory(user.id);
  return NextResponse.json({ success: true, history });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { topic, transcript, durationSeconds } = body;

    if (!topic || !transcript) {
      return NextResponse.json({ success: false, error: 'TOPIC_AND_TRANSCRIPT_REQUIRED' }, { status: 400 });
    }

    const result = await evaluateSpeakingAttempt(user.id, topic, transcript, durationSeconds || 60);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
