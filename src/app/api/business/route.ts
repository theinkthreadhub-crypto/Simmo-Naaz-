import { NextResponse, type NextRequest } from 'next/server';
import { getActiveBusiness, createBusiness, updateBrandProfile, getBrandProfile, getUserBusinesses } from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  let business = await getActiveBusiness(userId);
  if (!business) {
    // Initialize default active business for creator
    business = await createBusiness(userId, {
      name: 'InkThread Hub',
      description: 'D2C Streetwear & Heavyweight Apparel Brand',
      industry: 'Fashion & Apparel',
      businessType: 'E_COMMERCE',
      primaryGoal: '₹1L Monthly Direct Sales'
    });
    await updateBrandProfile(userId, business.id, {
      tagline: 'Wear Your Vibe — Heavyweight 280 GSM Streetwear',
      positioning: 'Accessible luxury streetwear designed and crafted in India'
    });
  }

  const profile = await getBrandProfile(business.id);
  const allBusinesses = await getUserBusinesses(userId);

  return NextResponse.json({
    activeBusiness: business,
    brandProfile: profile,
    allBusinesses
  });
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
    if (!body.name) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    const business = await createBusiness(userId, body);
    if (body.brandProfile) {
      await updateBrandProfile(userId, business.id, body.brandProfile);
    }

    return NextResponse.json({ success: true, business });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
