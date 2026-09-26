import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessCampaigns, createCampaign } from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

async function requireOwnedBusiness(userId: string, businessId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'BUSINESS_ID_REQUIRED' }, { status: 400 });
    if (!(await requireOwnedBusiness(user.id, businessId))) {
      return NextResponse.json({ error: 'BUSINESS_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ campaigns: await getBusinessCampaigns(businessId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    if (!body.businessId || !body.name?.trim()) {
      return NextResponse.json({ error: 'businessId and name are required.' }, { status: 400 });
    }
    if (!(await requireOwnedBusiness(user.id, body.businessId))) {
      return NextResponse.json({ error: 'BUSINESS_NOT_FOUND' }, { status: 404 });
    }

    const campaign = await createCampaign(user.id, { ...body, name: body.name.trim() });
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
