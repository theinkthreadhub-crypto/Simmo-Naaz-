import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRuntimeQualitySummary } from '@/lib/evals/runtimeLearning';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const summary = await getRuntimeQualitySummary(user.id);
  return NextResponse.json({ success: true, summary });
}
