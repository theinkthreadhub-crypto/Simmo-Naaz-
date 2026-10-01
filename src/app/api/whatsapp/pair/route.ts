import { NextResponse } from 'next/server';

function qrOnlyResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'WHATSAPP_QR_ONLY',
      message: 'MENTRA uses WhatsApp QR self-chat only.',
      connectionPath: '/connections/whatsapp'
    },
    { status: 410 }
  );
}

export async function GET() {
  return qrOnlyResponse();
}

export async function POST() {
  return qrOnlyResponse();
}
