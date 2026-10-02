import { NextRequest, NextResponse } from 'next/server';
import { runBrowserTask } from '@/lib/browser/browserUse';
import { verifySupabaseUserToken } from '@/lib/worker/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = auth?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySupabaseUserToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    task?: string;
    useCloud?: boolean;
    model?: string;
    maxSteps?: number;
  } | null;

  const task = body?.task?.trim();
  if (!task || task.length < 3 || task.length > 8000) {
    return NextResponse.json({ ok: false, error: 'Invalid task.' }, { status: 400 });
  }

  const result = await runBrowserTask({
    task,
    useCloud: Boolean(body?.useCloud),
    model: body?.model,
    maxSteps: body?.maxSteps
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
