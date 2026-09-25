import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordDecision } from '@/lib/db/projects';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, title, rationale, alternatives, expectedOutcome } = body;

    if (!title || !rationale) {
      return NextResponse.json({ success: false, error: 'TITLE_AND_RATIONALE_REQUIRED' }, { status: 400 });
    }

    const decision = await recordDecision(user.id, {
      projectId,
      title,
      rationale,
      alternatives,
      expectedOutcome
    });

    return NextResponse.json({ success: true, decision });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
