import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runMentra } from '@/lib/ai/core';
import { speechProvider } from '@/lib/speech/speechProvider';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function safeDuration(value: FormDataEntryValue | null): number {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 60 * 30);
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

  const form = await req.formData().catch(() => null);

  if (!form) {
    return NextResponse.json(
      { success: false, error: 'INVALID_MULTIPART_BODY' },
      { status: 400 }
    );
  }

  const audio = form.get('audio');
  const textValue = form.get('text');
  const typedText =
    typeof textValue === 'string'
      ? textValue.trim()
      : '';
  const durationSeconds = safeDuration(form.get('duration'));
  const audioBlob = audio instanceof Blob ? audio : null;

  if (!audioBlob && !typedText) {
    return NextResponse.json(
      { success: false, error: 'VOICE_OR_TEXT_REQUIRED' },
      { status: 400 }
    );
  }

  if (audioBlob && audioBlob.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { success: false, error: 'AUDIO_TOO_LARGE' },
      { status: 413 }
    );
  }

  if (
    audioBlob &&
    audioBlob.type &&
    !audioBlob.type.startsWith('audio/')
  ) {
    return NextResponse.json(
      { success: false, error: 'AUDIO_MIME_TYPE_REQUIRED' },
      { status: 415 }
    );
  }

  const now = new Date().toISOString();

  const { data: voiceSession, error: sessionError } =
    await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        status: audioBlob ? 'TRANSCRIBING' : 'THINKING',
        mode: 'CONVERSATIONAL',
        duration_seconds: durationSeconds,
        input_audio_bytes: audioBlob?.size || 0,
        stt_provider: audioBlob
          ? speechProvider.getProviderName()
          : 'TEXT_INPUT',
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

  if (sessionError || !voiceSession?.id) {
    return NextResponse.json(
      {
        success: false,
        error:
          sessionError?.message || 'VOICE_SESSION_CREATE_FAILED'
      },
      { status: 500 }
    );
  }

  const sessionId = voiceSession.id;

  try {
    let transcript = typedText;
    let confidence = typedText ? 1 : 0;
    let detectedLanguage: string | undefined;

    if (audioBlob) {
      const stt = await speechProvider.transcribe(audioBlob);

      if (!stt.success || !stt.transcript) {
        await supabase
          .from('voice_sessions')
          .update({
            status: 'ERROR',
            error_message:
              stt.error || 'VOICE_TRANSCRIPTION_FAILED',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        return NextResponse.json(
          {
            success: false,
            error:
              stt.error || 'VOICE_TRANSCRIPTION_FAILED',
            provider: stt.provider
          },
          { status: 503 }
        );
      }

      transcript = stt.transcript;
      confidence = stt.confidence;
      detectedLanguage = stt.detectedLanguage;
    }

    const metrics = speechProvider.analyzeAudio(
      transcript,
      durationSeconds ||
        Math.max(1, transcript.split(/\s+/).length / 2.3)
    );

    await supabase
      .from('voice_sessions')
      .update({
        status: 'THINKING',
        transcript,
        analysis_metrics: metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    const result = await runMentra({
      userId: user.id,
      channel: 'VOICE',
      text: transcript,
      timestamp: new Date().toISOString(),
      externalMessageId: 'voice_' + sessionId
    });

    if (!result.success && result.status === 'FAILED') {
      await supabase
        .from('voice_sessions')
        .update({
          status: 'ERROR',
          response_text: result.message,
          conversation_id: result.conversationId || null,
          error_message:
            result.error ||
            result.message ||
            'VOICE_AI_FAILED',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      return NextResponse.json(
        {
          success: false,
          transcript,
          error:
            result.error ||
            result.message ||
            'VOICE_AI_FAILED'
        },
        { status: 500 }
      );
    }

    const { data: settings } = await supabase
      .from('voice_settings')
      .select(
        'tts_enabled, voice_id, speech_speed, language, auto_speak_responses'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    const ttsEnabled =
      (settings?.tts_enabled ?? true) &&
      (settings?.auto_speak_responses ?? true);

    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;
    let ttsProvider: string | undefined;
    let ttsError: string | undefined;

    if (ttsEnabled && result.message) {
      const tts = await speechProvider.synthesize(
        result.message.replace(/[*_#]/g, ''),
        {
          voice: settings?.voice_id || 'echo',
          speed: Number(settings?.speech_speed || 1),
          language: settings?.language || 'hi-IN'
        }
      );

      ttsProvider = tts.provider;

      if (tts.success && tts.audioBase64) {
        audioBase64 = tts.audioBase64;
        audioMimeType = tts.mimeType;
      } else {
        ttsError = tts.error;
      }
    }

    const finalStatus =
      result.status === 'WAITING_APPROVAL'
        ? 'WAITING_APPROVAL'
        : 'COMPLETE';

    await supabase
      .from('voice_sessions')
      .update({
        status: finalStatus,
        transcript,
        response_text: result.message,
        conversation_id: result.conversationId || null,
        analysis_metrics: metrics,
        tts_provider: ttsProvider || null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      status: result.status,
      voiceSessionId: sessionId,
      conversationId: result.conversationId,
      transcript,
      confidence,
      detectedLanguage,
      metrics,
      message: result.message,
      cards: result.cards,
      toolCallsExecuted: result.toolCallsExecuted,
      audio:
        audioBase64 && audioMimeType
          ? {
              base64: audioBase64,
              mimeType: audioMimeType
            }
          : null,
      ttsError: ttsError || null
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    await supabase
      .from('voice_sessions')
      .update({
        status: 'ERROR',
        error_message: message.slice(0, 2000),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
