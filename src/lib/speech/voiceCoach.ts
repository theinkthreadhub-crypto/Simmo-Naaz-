import { createClient } from '@/lib/supabase/server';
import { speechProvider, SpeechAnalysisResult } from './speechProvider';

export interface SpeakingFeedback {
  strengths: string[];
  improvements: string[];
  nextFocus: string;
  clarityScore: number;
  xpAwarded: number;
}

export interface VoicePracticeAttempt {
  id: string;
  skillId: string;
  topic: string;
  transcript: string;
  metrics: SpeechAnalysisResult;
  feedback: SpeakingFeedback;
  createdAt: string;
}

export async function evaluateSpeakingAttempt(
  userId: string,
  topic: string,
  transcript: string,
  durationSeconds: number
): Promise<{ success: boolean; attempt?: VoicePracticeAttempt; error?: string }> {
  if (!transcript || transcript.trim().length === 0) {
    return { success: false, error: 'TRANSCRIPT_EMPTY' };
  }

  const metrics = speechProvider.analyzeAudio(transcript, durationSeconds);

  // Derive coaching strengths and improvements
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (metrics.speakingRateWpm >= 120 && metrics.speakingRateWpm <= 160) {
    strengths.push('Optimal executive speaking cadence (120–160 WPM).');
  } else if (metrics.speakingRateWpm < 120) {
    improvements.push(`Pacing is slightly slow (${metrics.speakingRateWpm} WPM). Aim for more dynamic energy.`);
  } else {
    improvements.push(`Pacing is fast (${metrics.speakingRateWpm} WPM). Insert deliberate pauses for authority.`);
  }

  if (metrics.fillerWordsCount === 0) {
    strengths.push('Flawless articulation with zero detected filler words.');
  } else if (metrics.fillerWordsCount <= 3) {
    strengths.push(`Controlled delivery with minimal filler usage (${metrics.fillerWordsCount}).`);
  } else {
    improvements.push(`Detected ${metrics.fillerWordsCount} filler words (${metrics.fillerWordsList.join(', ')}). Replace with silence.`);
  }

  if (metrics.wordCount >= 50) {
    strengths.push('Substantive depth and message structure.');
  }

  const nextFocus = improvements.length > 0
    ? improvements[0]
    : 'Elevate closing call-to-action impact.';

  const xpReward = Math.min(Math.round(metrics.clarityScore * 0.4), 40);

  const feedback: SpeakingFeedback = {
    strengths,
    improvements,
    nextFocus,
    clarityScore: metrics.clarityScore,
    xpAwarded: xpReward
  };

  try {
    const supabase = createClient();
    const { data: record, error } = await supabase
      .from('voice_practices')
      .insert({
        user_id: userId,
        skill_id: 'public_speaking',
        topic,
        transcript,
        audio_metrics: metrics,
        feedback,
        xp_awarded: xpReward
      })
      .select()
      .single();

    if (!error && record) {
      // Award skill XP & player XP
      try {
        await supabase.rpc('increment_player_xp', { p_user_id: userId, p_xp: xpReward });
      } catch {
        // Fallback
      }
    }

    return {
      success: true,
      attempt: {
        id: record?.id || `vp_${Date.now()}`,
        skillId: 'public_speaking',
        topic,
        transcript,
        metrics,
        feedback,
        createdAt: new Date().toISOString()
      }
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function getSpeakingHistory(userId: string): Promise<VoicePracticeAttempt[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('voice_practices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      skillId: d.skill_id,
      topic: d.topic,
      transcript: d.transcript,
      metrics: d.audio_metrics,
      feedback: d.feedback,
      createdAt: d.created_at
    }));
  } catch {
    return [];
  }
}
