import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runLeadAgent } from '@/lib/agents/lead/runner';

export const dynamic = 'force-dynamic';
// Vercel Hobby allows up to 60s. Keep AI_LEAD_AGENT_TIME_BUDGET_MS below this.
export const maxDuration = 60;

const startSchema = z.object({
  query: z.string().trim().min(3, 'Describe the task in a few words.').max(2000),
  title: z.string().trim().max(120).optional()
});

type RunRow = {
  id: string;
  title: string;
  status: string;
  current_stage: string | null;
  input: Record<string, any> | null;
  output: Record<string, any> | null;
  approval_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};

function toRun(row: RunRow) {
  const output = row.output || {};
  return {
    id: row.id,
    title: row.title,
    query: typeof row.input?.query === 'string' ? row.input.query : row.title,
    status: row.status,
    stage: row.current_stage,
    plan: output.plan || null,
    steps: Array.isArray(output.steps) ? output.steps : [],
    summary: typeof output.summary === 'string' ? output.summary : null,
    usage: output.usage || null,
    durationMs: typeof output.durationMs === 'number' ? output.durationMs : null,
    approvalId: row.approval_id,
    error: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 10));

  const { data, error } = await supabase
    .from('agent_tasks')
    .select('id, title, status, current_stage, input, output, approval_id, error_message, started_at, completed_at')
    .eq('user_id', user.id)
    .eq('task_type', 'LEAD_AGENT_RUN')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: ((data || []) as RunRow[]).map(toRun) });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = startSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  try {
    const result = await runLeadAgent(user.id, {
      taskTitle: parsed.data.title || parsed.data.query.slice(0, 80),
      query: parsed.data.query
    });

    return NextResponse.json({
      runId: result.runId,
      status: result.status,
      summary: result.summary
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
