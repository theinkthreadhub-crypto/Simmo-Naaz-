import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { speechProvider } from '@/lib/speech/speechProvider';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('audio') as Blob | null;
    const durationSec = parseFloat(formData.get('duration') as string || '0');

    if (!file) {
      return NextResponse.json({ success: false, error: 'AUDIO_FILE_MISSING' }, { status: 400 });
    }

    const { transcript, confidence, detectedLanguage } = await speechProvider.transcribe(file);
    const metrics = speechProvider.analyzeAudio(transcript, durationSec);

    return NextResponse.json({
      success: true,
      transcript,
      confidence,
      detectedLanguage,
      metrics
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
