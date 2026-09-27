import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { speechProvider } from '@/lib/speech/speechProvider';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('audio');
    const durationSec = Number(formData.get('duration') || 0);

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'AUDIO_FILE_MISSING' },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { success: false, error: 'AUDIO_TOO_LARGE' },
        { status: 413 }
      );
    }

    if (file.type && !file.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'AUDIO_MIME_TYPE_REQUIRED' },
        { status: 415 }
      );
    }

    const result = await speechProvider.transcribe(file);

    if (!result.success || !result.transcript) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error || 'VOICE_TRANSCRIPTION_FAILED',
          provider: result.provider
        },
        { status: 503 }
      );
    }

    const metrics = speechProvider.analyzeAudio(
      result.transcript,
      Number.isFinite(durationSec) ? durationSec : 0
    );

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      detectedLanguage: result.detectedLanguage,
      provider: result.provider,
      metrics
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      { status: 500 }
    );
  }
}
