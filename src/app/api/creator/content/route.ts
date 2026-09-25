import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessContent, createContentItem, updateContentStatus } from '@/lib/db/creator';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || 'biz_default';
  const campaignId = searchParams.get('campaignId') || undefined;

  const content = await getBusinessContent(businessId, campaignId);
  return NextResponse.json({ content });
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
    if (!body.businessId || !body.title) {
      return NextResponse.json({ error: 'businessId and title are required.' }, { status: 400 });
    }

    const item = await createContentItem(userId, body);
    return NextResponse.json({ success: true, contentItem: item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.contentId || !body.status) {
      return NextResponse.json({ error: 'contentId and status are required.' }, { status: 400 });
    }

    await updateContentStatus(body.contentId, body.status);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
