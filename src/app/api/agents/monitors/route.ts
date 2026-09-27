import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { scheduleOperativeAgent } from '@/lib/agents/monitorScheduler';

const createSchema = z.object({
  title: z.string().min(1).max(120),
  objective: z.string().min(1).max(2000),
  cadence: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  notifyWhen: z.string().max(1000).optional(),
  notifyOnEveryRun: z.boolean().default(false),
  agentKey: z.string().max(100).optional()
});

const actionSchema = z.object({
  jobId: z.string().uuid(),
  action: z.enum(['PAUSE', 'RESUME'])
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select(
      'id, payload, recurrence, status, scheduled_for, next_run_at, last_run_at, attempt_count, claimed_at, lease_expires_at'
    )
    .eq('user_id', user.id)
    .eq('type', 'AGENT_SCHEDULE')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ monitors: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
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

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: job, error: lookupError } = await supabase
    .from('scheduled_jobs')
    .select('id, payload, status')
    .eq('id', parsed.data.jobId)
    .eq('user_id', user.id)
    .eq('type', 'AGENT_SCHEDULE')
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'MONITOR_NOT_FOUND' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const nextRun = new Date(Date.now() + 60_000).toISOString();
  const agentKey = job.payload?.agent_key;

  if (parsed.data.action === 'PAUSE') {
    const { error } = await supabase
      .from('scheduled_jobs')
      .update({
        status: 'PAUSED',
        next_run_at: null,
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
        updated_at: now
      })
      .eq('id', job.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (agentKey) {
      await supabase
        .from('agent_runtime_state')
        .update({
          status: 'PAUSED',
          next_run_at: null,
          updated_at: now
        })
        .eq('user_id', user.id)
        .eq('agent_key', agentKey);
    }

    return NextResponse.json({ success: true, status: 'PAUSED' });
  }

  const { error } = await supabase
    .from('scheduled_jobs')
    .update({
      status: 'SCHEDULED',
      scheduled_for: nextRun,
      next_run_at: nextRun,
      attempt_count: 0,
      claimed_at: null,
      claimed_by: null,
      lease_expires_at: null,
      updated_at: now
    })
    .eq('id', job.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (agentKey) {
    await supabase
      .from('agent_runtime_state')
      .update({
        status: 'ACTIVE',
        last_error: null,
        next_run_at: nextRun,
        updated_at: now
      })
      .eq('user_id', user.id)
      .eq('agent_key', agentKey);
  }

  return NextResponse.json({
    success: true,
    status: 'SCHEDULED',
    nextRunAt: nextRun
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const jobId = typeof body?.jobId === 'string' ? body.jobId : '';

  if (!jobId) {
    return NextResponse.json({ error: 'JOB_ID_REQUIRED' }, { status: 400 });
  }

  const { data: job, error: lookupError } = await supabase
    .from('scheduled_jobs')
    .select('id, payload')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .eq('type', 'AGENT_SCHEDULE')
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'MONITOR_NOT_FOUND' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('scheduled_jobs')
    .update({
      status: 'CANCELLED',
      next_run_at: null,
      claimed_at: null,
      claimed_by: null,
      lease_expires_at: null,
      updated_at: now
    })
    .eq('id', jobId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (job.payload?.agent_key) {
    await supabase
      .from('agent_runtime_state')
      .update({
        status: 'COMPLETE',
        next_run_at: null,
        updated_at: now
      })
      .eq('user_id', user.id)
      .eq('agent_key', job.payload.agent_key);
  }

  return NextResponse.json({ success: true, status: 'CANCELLED' });
}
