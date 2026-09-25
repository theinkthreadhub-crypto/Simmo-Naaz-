import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWhatsAppLinkCode } from '@/lib/integrations/whatsapp/linking';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    connection: conn || {
      status: 'NOT_CONFIGURED',
      verified: false,
      phone_number: null
    }
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const code = await generateWhatsAppLinkCode(user.id);
    return NextResponse.json({
      success: true,
      linkCode: code,
      expiresInMinutes: 15,
      instructions: `Send this 6-digit code to the official MENTRA WhatsApp number to link your account.`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
