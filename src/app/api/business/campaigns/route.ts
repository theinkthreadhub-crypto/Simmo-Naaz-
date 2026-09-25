import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessCampaigns, createCampaign } from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || 'biz_default';

  const campaigns = await getBusinessCampaigns(businessId);
  return NextResponse.json({ campaigns });
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
    if (!body.businessId || !body.name) {
      return NextResponse.json({ error: 'businessId and name are required.' }, { status: 400 });
    }

    const campaign = await createCampaign(userId, body);
    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
