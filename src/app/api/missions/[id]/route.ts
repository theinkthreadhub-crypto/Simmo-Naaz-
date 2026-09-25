import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executePlanStep } from '@/lib/planner/planEngine';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: mission, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !mission) {
    return NextResponse.json({ success: false, error: 'MISSION_NOT_FOUND' }, { status: 404 });
  }

  // Fetch linked plan
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('mission_id', params.id)
    .eq('user_id', user.id)
    .single();

  let steps: any[] = [];
  if (plan) {
    const { data: stepList } = await supabase
      .from('plan_steps')
      .select('*')
      .eq('plan_id', plan.id)
      .order('step_index', { ascending: true });
    steps = stepList || [];
  }

  return NextResponse.json({
    success: true,
    mission: {
      ...mission,
      plan: plan ? { ...plan, steps } : null
    }
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, stepIndex, planId } = body;

    if (action === 'EXECUTE_STEP') {
      const result = await executePlanStep(planId, stepIndex, user.id);
      return NextResponse.json(result);
    }

    if (action === 'PAUSE' || action === 'RESUME' || action === 'CANCEL') {
      const newStatus = action === 'PAUSE' ? 'PAUSED' : action === 'RESUME' ? 'ACTIVE' : 'CANCELLED';
      await supabase
        .from('missions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, status: newStatus });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
