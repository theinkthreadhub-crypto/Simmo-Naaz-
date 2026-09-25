import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessAssets, createCreativeAsset } from '@/lib/db/creator';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || 'biz_default';
  const campaignId = searchParams.get('campaignId') || undefined;

  const assets = await getBusinessAssets(businessId, campaignId);
  return NextResponse.json({ assets });
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
    if (!body.businessId || !body.title || !body.assetType) {
      return NextResponse.json({ error: 'businessId, title, and assetType are required.' }, { status: 400 });
    }

    const asset = await createCreativeAsset(userId, body);
    return NextResponse.json({ success: true, asset });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
