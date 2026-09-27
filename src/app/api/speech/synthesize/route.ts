import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { speechProvider } from '@/lib/speech/speechProvider';

const schema = z.object({
  text: z.string().min(1).max(4000)
});

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

  const parsed = schema.safeParse(
    await req.json().catch(() => ({}))
  );

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'INVALID_TTS_REQUEST' },
      { status: 400 }
    );
  }

  const { data: settings } = await supabase
    .from('voice_settings')
    .select(
      'tts_enabled, voice_id, speech_speed, language'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (settings?.tts_enabled === false) {
    return NextResponse.json(
      { success: false, error: 'TTS_DISABLED_BY_USER' },
      { status: 409 }
    );
  }

  const result = await speechProvider.synthesize(
    parsed.data.text,
    {
      voice: settings?.voice_id || 'echo',
      speed: Number(settings?.speech_speed || 1),
      language: settings?.language || 'hi-IN'
    }
  );

  if (!result.success || !result.audioBase64) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'TTS_FAILED',
        provider: result.provider
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    provider: result.provider,
    audio: {
      base64: result.audioBase64,
      mimeType: result.mimeType
    }
  });
}
