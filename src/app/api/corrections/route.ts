import { NextResponse, type NextRequest } from 'next/server';
import { applyUserCorrection, getActiveCorrections } from '@/lib/feedback/correctionEngine';
import { createClient } from '@/lib/supabase/server';

async function requireUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    if (!body.correctionType || !body.targetEntityType || body.newValue === undefined) {
      return NextResponse.json(
        { error: 'correctionType, targetEntityType, and newValue are required.' },
        { status: 400 }
      );
    }

    return NextResponse.json(await applyUserCorrection(userId, body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    return NextResponse.json({ corrections: await getActiveCorrections(userId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
