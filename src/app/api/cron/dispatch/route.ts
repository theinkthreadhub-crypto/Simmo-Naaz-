import { NextRequest, NextResponse } from 'next/server';
import { claimAndDispatchDueJobs } from '@/lib/scheduler/cronDispatcher';

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  // Verify cron secret if set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key !== cronSecret) {
      return NextResponse.json({ error: 'UNAUTHORIZED_CRON' }, { status: 401 });
    }
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
