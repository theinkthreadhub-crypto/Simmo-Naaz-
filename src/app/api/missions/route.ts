import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createMission, listUserMissions } from '@/lib/missions/missionEngine';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const missions = await listUserMissions(user.id);
  return NextResponse.json({ success: true, missions });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, objective, timelineDays } = body;

    if (!title || !objective) {
      return NextResponse.json({ success: false, error: 'TITLE_AND_OBJECTIVE_REQUIRED' }, { status: 400 });
    }

    const mission = await createMission(user.id, title, objective, timelineDays || 7);
    return NextResponse.json({ success: true, mission });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
