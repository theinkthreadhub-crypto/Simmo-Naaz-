import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessContent, createContentItem, updateContentStatus } from '@/lib/db/creator';
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
    const campaignId = request.nextUrl.searchParams.get('campaignId') || undefined;
    if (!businessId) return NextResponse.json({ error: 'BUSINESS_ID_REQUIRED' }, { status: 400 });
    if (!(await requireOwnedBusiness(user.id, businessId))) {
      return NextResponse.json({ error: 'BUSINESS_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ content: await getBusinessContent(businessId, campaignId) });
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
    if (!body.businessId || !body.title?.trim()) {
      return NextResponse.json({ error: 'businessId and title are required.' }, { status: 400 });
    }
    if (!(await requireOwnedBusiness(user.id, body.businessId))) {
      return NextResponse.json({ error: 'BUSINESS_NOT_FOUND' }, { status: 404 });
    }

    const item = await createContentItem(user.id, { ...body, title: body.title.trim() });
    return NextResponse.json({ success: true, contentItem: item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    if (!body.contentId || !body.status) {
      return NextResponse.json({ error: 'contentId and status are required.' }, { status: 400 });
    }

    await updateContentStatus(user.id, body.contentId, body.status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
