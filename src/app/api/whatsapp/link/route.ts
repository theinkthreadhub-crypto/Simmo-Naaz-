import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateWhatsAppLinkCode,
  linkUserByCode,
  linkUserDirectly
} from '@/lib/integrations/whatsapp/linking';
import { whatsappClient } from '@/lib/integrations/whatsapp/client';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: conn, error: connError } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (connError) {
    return NextResponse.json({ success: false, error: connError.message }, { status: 500 });
  }

  // Also retrieve active non-expired link code if one was generated
  const { data: activeCode } = await supabase
    .from('whatsapp_link_codes')
    .select('code, expires_at')
    .eq('user_id', user.id)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isConfigured = whatsappClient.isConfigured();
  const botNumber = process.env.WHATSAPP_PHONE_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || null;

  return NextResponse.json({
    success: true,
    userId: user.id,
    cloudConfigured: isConfigured,
    botPhoneNumber: botNumber,
    connection: conn || {
      status: 'NOT_CONFIGURED',
      verified: false,
      phone_number: null
    },
    activeCode: activeCode ? {
      code: activeCode.code,
      expiresAt: activeCode.expires_at
    } : null
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: any = {};
  try {
    const rawText = await req.text();
    if (rawText) {
      body = JSON.parse(rawText);
    }
  } catch {
    body = {};
  }

  const action = body?.action || 'generate_code';

  try {
    if (action === 'direct_link') {
      const phoneNumber = String(body.phoneNumber || '').trim();
      if (!phoneNumber) {
        return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 });
      }
      const res = await linkUserDirectly(user.id, phoneNumber);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    if (action === 'verify_code') {
      const phoneNumber = String(body.phoneNumber || '').trim();
      const code = String(body.code || '').trim();
      if (!phoneNumber || !code) {
        return NextResponse.json({ success: false, error: 'Both phone number and 6-digit code are required.' }, { status: 400 });
      }
      const res = await linkUserByCode(phoneNumber, code);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    // Default: Generate new 6-digit link code
    const code = await generateWhatsAppLinkCode(user.id);
    return NextResponse.json({
      success: true,
      linkCode: code,
      expiresInMinutes: 15,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      instructions: `Send this 6-digit code to the official MENTRA WhatsApp number to link your account.`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

