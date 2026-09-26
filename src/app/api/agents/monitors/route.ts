import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { scheduleOperativeAgent } from '@/lib/agents/operativeAgent';

const createSchema = z.object({
  title: z.string().min(1).max(120),
  objective: z.string().min(1).max(2000),
  cadence: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  notifyWhen: z.string().max(1000).optional(),
  notifyOnEveryRun: z.boolean().default(false),
  agentKey: z.string().max(100).optional()
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select('id, payload, recurrence, status, scheduled_for, next_run_at, last_run_at, attempt_count')
    .eq('user_id', user.id)
    .eq('type', 'AGENT_SCHEDULE')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ monitors: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const scheduled = await scheduleOperativeAgent(user.id, parsed.data);
    return NextResponse.json({ success: true, ...scheduled });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const jobId = typeof body?.jobId === 'string' ? body.jobId : '';
  if (!jobId) return NextResponse.json({ error: 'JOB_ID_REQUIRED' }, { status: 400 });

  const { error } = await supabase
    .from('scheduled_jobs')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .eq('type', 'AGENT_SCHEDULE');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
