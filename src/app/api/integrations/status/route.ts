import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: true, integrations: [] });
  }

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('service, status, account_email, scopes, last_sync_at')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, integrations: integrations || [] });
}
