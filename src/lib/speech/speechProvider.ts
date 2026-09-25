export interface SpeechAnalysisResult {
  durationSeconds: number;
  wordCount: number;
  speakingRateWpm: number;
  pauseAnalysisStatus: 'MEASURED' | 'DERIVED' | 'PAUSE_ANALYSIS_UNAVAILABLE';
  pauseCount: number | null;
  fillerWordsCount: number;
  fillerWordsList: string[];
  clarityScore: number;
}

export interface SpeechSynthesisOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

export interface SpeechProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(audioBlobOrBase64: string | Blob): Promise<{ transcript: string; confidence: number; detectedLanguage?: string }>;
  synthesize(text: string, options?: SpeechSynthesisOptions): Promise<{ audioUrl?: string; audioBase64?: string; mimeType: string }>;
  analyzeAudio(transcript: string, durationSeconds: number): SpeechAnalysisResult;
}

export class ModularSpeechProvider implements SpeechProvider {
  name = 'mentra_speech_engine';
  private apiKey: string;
  private sttModel: string;
  private ttsModel: string;

  constructor() {
    this.apiKey = process.env.SPEECH_API_KEY || '';
    this.sttModel = process.env.SPEECH_STT_MODEL || 'whisper-1';
    this.ttsModel = process.env.SPEECH_TTS_MODEL || 'tts-1';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async transcribe(audioBlobOrBase64: string | Blob): Promise<{ transcript: string; confidence: number; detectedLanguage?: string }> {
    if (!this.isAvailable()) {
      return {
        transcript: '',
        confidence: 0,
        detectedLanguage: 'en'
      };
    }

    try {
      if (this.apiKey && typeof audioBlobOrBase64 !== 'string') {
        const formData = new FormData();
        formData.append('file', audioBlobOrBase64, 'audio.webm');
        formData.append('model', this.sttModel);

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}` },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          return { transcript: data.text || '', confidence: 0.95, detectedLanguage: data.language };
        }
      }

      return { transcript: '', confidence: 0 };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[SpeechProvider] STT error:', msg);
      return { transcript: '', confidence: 0 };
    }
  }

  async synthesize(text: string, options?: SpeechSynthesisOptions): Promise<{ audioUrl?: string; audioBase64?: string; mimeType: string }> {
    if (!this.apiKey) {
      return { mimeType: 'audio/mp3' };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.ttsModel,
          input: text.slice(0, 1000),
          voice: options?.voice || 'echo',
          speed: options?.speed || 1.0
        })
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          audioBase64: base64,
          mimeType: 'audio/mp3'
        };
      }

      return { mimeType: 'audio/mp3' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[SpeechProvider] TTS error:', msg);
      return { mimeType: 'audio/mp3' };
    }
  }

  /**
   * Deterministic Speech Metric Analysis
   * Truthfully derives word count, speaking rate, and filler words from transcript.
   * Without acoustic timestamps, pauseCount is marked PAUSE_ANALYSIS_UNAVAILABLE.
   */
  analyzeAudio(transcript: string, durationSeconds: number): SpeechAnalysisResult {
    const cleanText = transcript.trim().toLowerCase();
    const words = cleanText ? cleanText.split(/\s+/) : [];
    const wordCount = words.length;

    // Detect common English and Hindi filler words
    const fillerPatterns = [
      'um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally',
      'matlab', 'yaani', 'toh', 'voh', 'hmm', 'ah', 'er'
    ];

    const foundFillers: string[] = [];
    let fillerCount = 0;

    for (const pattern of fillerPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = cleanText.match(regex);
      if (matches) {
        fillerCount += matches.length;
        foundFillers.push(...matches);
      }
    }

    const durationMin = Math.max(durationSeconds / 60, 0.1);
    const speakingRateWpm = Math.round(wordCount / durationMin);

    // Score based on ideal 120-160 WPM pace and low filler count
    let clarity = 100;
    if (speakingRateWpm < 100 || speakingRateWpm > 180) clarity -= 15;
    if (speakingRateWpm < 70 || speakingRateWpm > 210) clarity -= 20;
    clarity -= Math.min(fillerCount * 5, 40);
    clarity = Math.max(Math.min(clarity, 100), 20);

    return {
      durationSeconds,
      wordCount,
      speakingRateWpm,
      pauseAnalysisStatus: 'PAUSE_ANALYSIS_UNAVAILABLE',
      pauseCount: null,
      fillerWordsCount: fillerCount,
      fillerWordsList: Array.from(new Set(foundFillers)),
      clarityScore: clarity
    };
  }
}

export const speechProvider = new ModularSpeechProvider();
