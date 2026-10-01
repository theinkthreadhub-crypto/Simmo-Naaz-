import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'PAIRING_CODE_DISABLED',
    message: 'MENTRA supports WhatsApp QR pairing only.'
  }, { status: 410 });
}
