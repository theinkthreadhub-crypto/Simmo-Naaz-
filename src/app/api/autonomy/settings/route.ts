import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data } = await supabase
    .from('autonomy_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    settings: data || {
      mode: 'ASSISTED',
      max_planning_steps: 8,
      max_tool_calls: 12,
      max_browser_actions: 5,
      trusted_internal_actions: true
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
    const { mode, max_planning_steps, max_tool_calls, max_browser_actions, trusted_internal_actions } = body;

    const { error } = await supabase
      .from('autonomy_settings')
      .upsert({
        user_id: user.id,
        mode: mode || 'ASSISTED',
        max_planning_steps: max_planning_steps || 8,
        max_tool_calls: max_tool_calls || 12,
        max_browser_actions: max_browser_actions || 5,
        trusted_internal_actions: trusted_internal_actions ?? true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Autonomy settings updated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
