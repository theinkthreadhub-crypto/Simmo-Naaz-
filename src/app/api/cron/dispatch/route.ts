import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { claimAndDispatchDueJobs } from '@/lib/scheduler/cronDispatcher';

function safeEqual(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'CRON_SECRET_NOT_CONFIGURED'
      },
      { status: 503 }
    );
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  if (!safeEqual(req.headers.get('authorization'), expectedHeader)) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_CRON' },
      { status: 401 }
    );
  }

  try {
    const executedJobs = await claimAndDispatchDueJobs();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dispatchedCount: executedJobs.length,
      jobs: executedJobs
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
