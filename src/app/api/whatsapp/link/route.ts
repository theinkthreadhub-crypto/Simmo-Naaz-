import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWhatsAppLinkCode } from '@/lib/integrations/whatsapp/linking';

function cloudApiReady(): boolean {
  return (
    process.env.WHATSAPP_ENABLED !== 'false' &&
    Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_VERIFY_TOKEN &&
      process.env.WHATSAPP_APP_SECRET &&
      process.env.WHATSAPP_BUSINESS_DISPLAY_NUMBER &&
      process.env.WHATSAPP_ALLOWED_NUMBERS
    )
  );
}

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { data: connection, error: connectionError } = await supabase
    .from('whatsapp_connections')
    .select(
      'status, verified, phone_number, display_phone_number, last_active_at, updated_at'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (connectionError) {
    return NextResponse.json(
      { success: false, error: connectionError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cloudApiReady: cloudApiReady(),
    officialDisplayNumber:
      process.env.WHATSAPP_BUSINESS_DISPLAY_NUMBER || null,
    connection: connection || {
      status: 'NOT_CONFIGURED',
      verified: false,
      phone_number: null,
      display_phone_number: null,
      last_active_at: null
    }
  });
}

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (!cloudApiReady()) {
    return NextResponse.json(
      {
        success: false,
        error: 'WHATSAPP_CLOUD_API_NOT_CONFIGURED'
      },
      { status: 503 }
    );
  }

  try {
    const code = await generateWhatsAppLinkCode(user.id);

    return NextResponse.json({
      success: true,
      linkCode: code,
      expiresInSeconds: 15 * 60,
      officialDisplayNumber:
        process.env.WHATSAPP_BUSINESS_DISPLAY_NUMBER || null
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
