import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { browserAgent } from '@/lib/agents/browserAgent';
import { computerAgent } from '@/lib/agents/computerAgent';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const [{ data: session }, { data: actions }] = await Promise.all([
    supabase
      .from('browser_sessions')
      .select('id, status, current_url, provider, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('browser_actions')
      .select(
        'id, session_id, action_type, target_url, risk_level, status, requires_approval, error_message, executed_at'
      )
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(20)
  ]);

  return NextResponse.json({
    success: true,
    cloudBrowser: {
      configured: browserAgent.isConfigured(),
      capabilities: browserAgent.getCapabilities()
    },
    localComputer: {
      configured: computerAgent.isConfigured(),
      capabilities: computerAgent.getCapabilities()
    },
    latestSession: session || null,
    recentActions: actions || []
  });
}
