import { NextRequest, NextResponse } from 'next/server';
import { claimAndDispatchDueJobs } from '@/lib/scheduler/cronDispatcher';

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  // Fail-Closed: If CRON_SECRET is not configured on the server, deny execution
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET_NOT_CONFIGURED: Cron dispatch is disabled until a secret is configured.' },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get('authorization');
  const expectedHeader = `Bearer ${cronSecret}`;

  if (!authHeader || authHeader !== expectedHeader) {
    return NextResponse.json({ error: 'UNAUTHORIZED_CRON: Invalid or missing Authorization token.' }, { status: 401 });
  }

  try {
    const executedJobs = await claimAndDispatchDueJobs();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dispatchedCount: executedJobs.length,
      jobs: executedJobs
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
