import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const body = await req.json();
    const phone = String(body.phoneNumber || '').replace(/[^0-9]/g, '');

    if (!phone || phone.length < 10) {
      return NextResponse.json({
        error: 'Please enter a valid phone number with country code (e.g. 919876543210)'
      }, { status: 400 });
    }

    // Try requesting pairing code from local worker if running
    try {
      const workerRes = await fetch(`http://127.0.0.1:10000/pair?phone=${phone}&userId=${user.id}`, {
        signal: AbortSignal.timeout(10_000)
      });
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        if (workerData.pairingCode) {
          return NextResponse.json({
            success: true,
            pairingCode: workerData.pairingCode,
            phone
          });
        }
      }
    } catch {
      // Local worker request failed, write request to Supabase for cloud worker
    }

    // Write pairing request into whatsapp_qr_sessions for worker to pick up
    await supabase.from('whatsapp_qr_sessions').upsert({
      user_id: user.id,
      worker_id: 'mentra-brain-01',
      status: 'PAIRING_REQUESTED',
      qr_code: `PAIR:${phone}`,
      qr_expires_at: new Date(Date.now() + 120_000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // Poll Supabase for 8 seconds to see if worker generated the code
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const { data } = await supabase
        .from('whatsapp_qr_sessions')
        .select('qr_code, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.qr_code && data.qr_code.startsWith('CODE:')) {
        const code = data.qr_code.replace('CODE:', '');
        return NextResponse.json({
          success: true,
          pairingCode: code,
          phone
        });
      }
    }

    return NextResponse.json({
      success: true,
      pending: true,
      phone,
      message: 'Pairing request dispatched to worker.'
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
