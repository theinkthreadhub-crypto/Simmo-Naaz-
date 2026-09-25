import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProject, listUserProjects } from '@/lib/db/projects';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const projects = await listUserProjects(user.id);
  return NextResponse.json({ success: true, projects });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, objective, targetDate, relatedGoalId, financeBudget, nextAction } = body;

    if (!title || !objective) {
      return NextResponse.json({ success: false, error: 'TITLE_AND_OBJECTIVE_REQUIRED' }, { status: 400 });
    }

    const project = await createProject(user.id, {
      title,
      description,
      objective,
      targetDate,
      relatedGoalId,
      financeBudget,
      nextAction
    });

    return NextResponse.json({ success: true, project });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
