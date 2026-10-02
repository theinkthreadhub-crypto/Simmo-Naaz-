import { NextResponse } from 'next/server';
import { requireUser, AuthRequiredError } from '@/lib/auth/requireUser';
import { getLangflowStatus } from '@/lib/langflow/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();

    const status = getLangflowStatus();
    return NextResponse.json({
      ...status,
      note: status.configured
        ? 'Langflow bridge is configured. MENTRA remains the execution and approval authority.'
        : 'Set the server-side LANGFLOW_* environment variables to activate the bridge.'
    });
  } catch (error) {
    if (error instanceof AuthRequiredError || (error instanceof Error && error.message === 'AUTH_REQUIRED')) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LANGFLOW_STATUS_FAILED' },
      { status: 500 }
    );
  }
}
