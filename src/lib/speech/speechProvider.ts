export interface SpeechAnalysisResult {
  durationSeconds: number;
  wordCount: number;
  speakingRateWpm: number;
  pauseAnalysisStatus:
    | 'MEASURED'
    | 'DERIVED'
    | 'PAUSE_ANALYSIS_UNAVAILABLE';
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

export interface SpeechTranscriptionResult {
  success: boolean;
  transcript: string;
  confidence: number;
  detectedLanguage?: string;
  provider: string;
  error?: string;
}

export interface SpeechSynthesisResult {
  success: boolean;
  audioBase64?: string;
  mimeType: string;
  provider: string;
  error?: string;
}

export interface SpeechProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(
    audioBlobOrBase64: string | Blob
  ): Promise<SpeechTranscriptionResult>;
  synthesize(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResult>;
  analyzeAudio(
    transcript: string,
    durationSeconds: number
  ): SpeechAnalysisResult;
}

function normalizeProvider(value: string): string {
  return value.trim().toLowerCase();
}

export class ModularSpeechProvider implements SpeechProvider {
  name = 'mentra_speech_engine';
  private provider: string;
  private apiKey: string;
  private sttModel: string;
  private ttsModel: string;
  private apiBase: string;

  constructor() {
    this.provider = normalizeProvider(
      process.env.SPEECH_PROVIDER || 'openai'
    );
    this.apiKey = process.env.SPEECH_API_KEY || '';
    this.sttModel =
      process.env.SPEECH_STT_MODEL || 'whisper-1';
    this.ttsModel =
      process.env.SPEECH_TTS_MODEL || 'tts-1';
    this.apiBase = (
      process.env.SPEECH_API_BASE ||
      'https://api.openai.com/v1'
    ).replace(/\/$/, '');
  }

  isAvailable(): boolean {
    return Boolean(
      this.apiKey &&
      this.provider === 'openai' &&
      process.env.VOICE_ENABLED !== 'false'
    );
  }

  getProviderName(): string {
    return this.provider;
  }

  async transcribe(
    audioBlobOrBase64: string | Blob
  ): Promise<SpeechTranscriptionResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        transcript: '',
        confidence: 0,
        provider: this.provider,
        error: 'SPEECH_PROVIDER_NOT_CONFIGURED'
      };
    }

    if (typeof audioBlobOrBase64 === 'string') {
      return {
        success: false,
        transcript: '',
        confidence: 0,
        provider: this.provider,
        error: 'BASE64_STT_INPUT_NOT_SUPPORTED'
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlobOrBase64, 'voice.webm');
      formData.append('model', this.sttModel);
      formData.append('response_format', 'verbose_json');

      const res = await fetch(
        `${this.apiBase}/audio/transcriptions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          },
          signal: AbortSignal.timeout(45_000),
          body: formData
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          transcript: '',
          confidence: 0,
          provider: this.provider,
          error:
            data?.error?.message ||
            `SPEECH_TRANSCRIPTION_FAILED_${res.status}`
        };
      }

      const transcript = String(data?.text || '').trim();

      if (!transcript) {
        return {
          success: false,
          transcript: '',
          confidence: 0,
          provider: this.provider,
          error: 'EMPTY_TRANSCRIPT'
        };
      }

      return {
        success: true,
        transcript,
        confidence: 0,
        detectedLanguage:
          typeof data?.language === 'string'
            ? data.language
            : undefined,
        provider: this.provider
      };
    } catch (error) {
      return {
        success: false,
        transcript: '',
        confidence: 0,
        provider: this.provider,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async synthesize(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        mimeType: 'audio/mpeg',
        provider: this.provider,
        error: 'SPEECH_PROVIDER_NOT_CONFIGURED'
      };
    }

    const input = String(text || '').trim();

    if (!input) {
      return {
        success: false,
        mimeType: 'audio/mpeg',
        provider: this.provider,
        error: 'TTS_TEXT_REQUIRED'
      };
    }

    try {
      const res = await fetch(
        `${this.apiBase}/audio/speech`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(45_000),
          body: JSON.stringify({
            model: this.ttsModel,
            input: input.slice(0, 4000),
            voice: options?.voice || 'echo',
            speed: Math.min(
              2,
              Math.max(0.25, Number(options?.speed || 1))
            ),
            response_format: 'mp3'
          })
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => '');

        return {
          success: false,
          mimeType: 'audio/mpeg',
          provider: this.provider,
          error:
            body.slice(0, 500) ||
            `SPEECH_SYNTHESIS_FAILED_${res.status}`
        };
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.byteLength === 0) {
        return {
          success: false,
          mimeType: 'audio/mpeg',
          provider: this.provider,
          error: 'EMPTY_TTS_AUDIO'
        };
      }

      if (buffer.byteLength > 6_000_000) {
        return {
          success: false,
          mimeType: 'audio/mpeg',
          provider: this.provider,
          error: 'TTS_AUDIO_TOO_LARGE'
        };
      }

      return {
        success: true,
        audioBase64: buffer.toString('base64'),
        mimeType: 'audio/mpeg',
        provider: this.provider
      };
    } catch (error) {
      return {
        success: false,
        mimeType: 'audio/mpeg',
        provider: this.provider,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  analyzeAudio(
    transcript: string,
    durationSeconds: number
  ): SpeechAnalysisResult {
    const cleanText = transcript.trim().toLowerCase();
    const words = cleanText ? cleanText.split(/\s+/) : [];
    const wordCount = words.length;

    const fillerPatterns = [
      'um',
      'uh',
      'like',
      'you know',
      'actually',
      'basically',
      'literally',
      'matlab',
      'yaani',
      'toh',
      'voh',
      'hmm',
      'ah',
      'er'
    ];

    const foundFillers: string[] = [];
    let fillerCount = 0;

    for (const pattern of fillerPatterns) {
      const regex = new RegExp(
        `\\b${pattern.replace(/[^a-z0-9 ]/gi, '')}\\b`,
        'gi'
      );
      const matches = cleanText.match(regex);

      if (matches) {
        fillerCount += matches.length;
        foundFillers.push(...matches);
      }
    }

    const safeDuration = Math.max(Number(durationSeconds || 0), 1);
    const durationMin = safeDuration / 60;
    const speakingRateWpm = Math.round(wordCount / durationMin);

    let clarity = 100;

    if (speakingRateWpm < 100 || speakingRateWpm > 180) {
      clarity -= 15;
    }

    if (speakingRateWpm < 70 || speakingRateWpm > 210) {
      clarity -= 20;
    }

    clarity -= Math.min(fillerCount * 5, 40);
    clarity = Math.max(Math.min(clarity, 100), 20);

    return {
      durationSeconds: safeDuration,
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
