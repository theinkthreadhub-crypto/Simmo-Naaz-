import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  let { data, error } = await supabase.from('whatsapp_qr_sessions')
    .select('qr_code,qr_expires_at,status').eq('user_id', user.id).maybeSingle();

  if (error) return NextResponse.json({ error: 'QR_LOOKUP_FAILED' }, { status: 503 });
  if (!data?.qr_code || data.status !== 'QR_READY' || !data.qr_expires_at || new Date(data.qr_expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'QR_EXPIRED_OR_UNAVAILABLE' }, { status: 404 });
  }
  const svg = await QRCode.toString(data.qr_code, {
    type: 'svg',
    errorCorrectionLevel: 'L',
    margin: 4,
    width: 360,
    color: { dark: '#000000', light: '#ffffff' }
  });
  return new NextResponse(svg, { headers: {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    'X-Content-Type-Options': 'nosniff'
  } });
}
