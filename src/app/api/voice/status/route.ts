import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { speechProvider } from '@/lib/speech/speechProvider';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const [{ data: settings }, { data: sessions }] =
    await Promise.all([
      supabase
        .from('voice_settings')
        .select(
          'tts_enabled, voice_id, speech_speed, language, auto_speak_responses, audio_retention_days'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('voice_sessions')
        .select(
          'id, status, mode, conversation_id, duration_seconds, stt_provider, tts_provider, error_message, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

  return NextResponse.json({
    success: true,
    provider: {
      name: speechProvider.getProviderName(),
      available: speechProvider.isAvailable()
    },
    rawAudioStoredByVoiceFlow: false,
    settings: settings || null,
    recentSessions: sessions || []
  });
}
