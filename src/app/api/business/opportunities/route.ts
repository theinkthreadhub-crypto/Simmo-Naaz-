import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessOpportunities, createOpportunity } from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || 'biz_default';

  const opportunities = await getBusinessOpportunities(businessId);
  return NextResponse.json({ opportunities });
}

export async function POST(request: NextRequest) {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const body = await request.json();
    if (!body.businessId || !body.title || !body.evidence) {
      return NextResponse.json({ error: 'businessId, title, and evidence are required.' }, { status: 400 });
    }

    const opp = await createOpportunity(userId, body);
    return NextResponse.json({ success: true, opportunity: opp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
