import { NextResponse, type NextRequest } from 'next/server';
import { getBusinessProducts, createProduct } from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId') || 'biz_default';

  const products = await getBusinessProducts(businessId);
  return NextResponse.json({ products });
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
    if (!body.businessId || !body.name || typeof body.price !== 'number') {
      return NextResponse.json({ error: 'businessId, name, and numeric price are required.' }, { status: 400 });
    }

    const product = await createProduct(userId, body);
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
