import { NextResponse, type NextRequest } from 'next/server';
import {
  getActiveBusiness,
  createBusiness,
  updateBrandProfile,
  getBrandProfile,
  getUserBusinesses
} from '@/lib/db/business';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const business = await getActiveBusiness(user.id);
    const allBusinesses = await getUserBusinesses(user.id);
    const profile = business ? await getBrandProfile(business.id) : null;

    return NextResponse.json({
      activeBusiness: business,
      brandProfile: profile,
      allBusinesses
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    const business = await createBusiness(user.id, {
      ...body,
      name: body.name.trim()
    });

    const brandProfile = body.brandProfile
      ? await updateBrandProfile(user.id, business.id, body.brandProfile)
      : null;

    return NextResponse.json({ success: true, business, brandProfile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
