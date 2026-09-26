import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAutomaticRecovery } from '@/lib/system/recoveryEngine';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const summary = await runAutomaticRecovery(user.id, true);
  return NextResponse.json({ success: true, summary });
}
