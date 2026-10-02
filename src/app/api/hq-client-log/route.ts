import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.warn('[HQ_CLIENT]', {
      stage: typeof body?.stage === 'string' ? body.stage : 'unknown',
      message: typeof body?.message === 'string' ? body.message.slice(0, 500) : 'unknown',
      mobile: Boolean(body?.mobile),
      userAgent:
        typeof body?.userAgent === 'string' ? body.userAgent.slice(0, 180) : '',
    });
  } catch {
    console.warn('[HQ_CLIENT] invalid diagnostic payload');
  }

  return NextResponse.json({ ok: true });
}
