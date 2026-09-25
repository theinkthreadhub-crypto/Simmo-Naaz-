import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data } = await supabase
    .from('voice_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    settings: data || {
      tts_enabled: true,
      voice_id: 'echo',
      speech_speed: 1.0,
      language: 'hi-IN',
      auto_speak_responses: true,
      audio_retention_days: 30
    }
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tts_enabled, voice_id, speech_speed, language, auto_speak_responses, audio_retention_days } = body;

    const { error } = await supabase
      .from('voice_settings')
      .upsert({
        user_id: user.id,
        tts_enabled: tts_enabled ?? true,
        voice_id: voice_id || 'echo',
        speech_speed: speech_speed || 1.0,
        language: language || 'hi-IN',
        auto_speak_responses: auto_speak_responses ?? true,
        audio_retention_days: audio_retention_days || 30,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Voice settings updated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
