import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemHealthSnapshot } from '@/lib/system/healthEngine';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const snapshot = await getSystemHealthSnapshot(user?.id);
  return NextResponse.json(snapshot);
}
