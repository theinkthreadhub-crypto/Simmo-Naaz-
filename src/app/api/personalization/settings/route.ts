import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data } = await supabase
    .from('personalization_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    settings: data || {
      level: 'STANDARD',
      use_calendar_patterns: true,
      use_learning_patterns: true,
      use_finance_context: true,
      use_wellness_context: false,
      auto_memory_candidates: true,
      recommendation_frequency: 'NORMAL'
    }
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { level, use_calendar_patterns, use_learning_patterns, use_finance_context, use_wellness_context, auto_memory_candidates, recommendation_frequency } = body;

    const { error } = await supabase
      .from('personalization_settings')
      .upsert({
        user_id: user.id,
        level: level || 'STANDARD',
        use_calendar_patterns: use_calendar_patterns ?? true,
        use_learning_patterns: use_learning_patterns ?? true,
        use_finance_context: use_finance_context ?? true,
        use_wellness_context: use_wellness_context ?? false,
        auto_memory_candidates: auto_memory_candidates ?? true,
        recommendation_frequency: recommendation_frequency || 'NORMAL',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Personalization settings updated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
