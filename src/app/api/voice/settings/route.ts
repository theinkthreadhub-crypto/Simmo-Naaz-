import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  tts_enabled: z.boolean(),
  voice_id: z.enum(['echo', 'alloy', 'fable', 'onyx']),
  speech_speed: z.number().min(0.5).max(2),
  language: z.enum(['hi-IN', 'en-IN', 'en-US']),
  auto_speak_responses: z.boolean(),
  audio_retention_days: z.number().int().min(0).max(365)
}).strict();

const defaults = {
  tts_enabled: true,
  voice_id: 'echo',
  speech_speed: 1,
  language: 'hi-IN',
  auto_speak_responses: true,
  audio_retention_days: 0
};

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

  const { data, error } = await supabase
    .from('voice_settings')
    .select(
      'tts_enabled, voice_id, speech_speed, language, auto_speak_responses, audio_retention_days'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    settings: data || defaults
  });
}

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
      {
        success: false,
        error: 'INVALID_VOICE_SETTINGS',
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('voice_settings')
    .upsert(
      {
        user_id: user.id,
        ...parsed.data,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    settings: parsed.data,
    message: 'Voice settings updated.'
  });
}
