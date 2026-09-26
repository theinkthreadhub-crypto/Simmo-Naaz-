import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleCalendarEvents } from '@/lib/integrations/google/calendar';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const timeMin = req.nextUrl.searchParams.get('timeMin') || undefined;
  const timeMax = req.nextUrl.searchParams.get('timeMax') || undefined;
  const maxResults = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 20));

  const result = await getGoogleCalendarEvents(user.id, timeMin, timeMax, maxResults);
  if (result.error) {
    const status = result.error.includes('CONNECTION_REQUIRED') || result.error.includes('TOKEN_') ? 409 : 502;
    return NextResponse.json({ success: false, error: result.error, events: [] }, { status });
  }

  return NextResponse.json({ success: true, events: result.events });
}
