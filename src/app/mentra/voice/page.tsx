'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Radio,
  ShieldCheck,
  Loader2
} from 'lucide-react';

type VoiceState =
  | 'IDLE'
  | 'RECORDING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'WAITING_APPROVAL'
  | 'ERROR';

interface VoiceResponse {
  success: boolean;
  status?: string;
  transcript?: string;
  message?: string;
  error?: string;
  audio?: {
    base64: string;
    mimeType: string;
  } | null;
  cards?: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    requiresApproval?: boolean;
    approvalId?: string;
  }>;
}

function preferredAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';

  const options = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4'
  ];

  return (
    options.find(type => MediaRecorder.isTypeSupported(type)) ||
    ''
  );
}

export default function MentraVoicePage() {
  const [voiceState, setVoiceState] =
    useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [mentraResponse, setMentraResponse] = useState('');
  const [textInput, setTextInput] = useState('');
  const [muted, setMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [approvalCount, setApprovalCount] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  };

  const cleanupStream = () => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const playResponse = async (
    audio: VoiceResponse['audio']
  ) => {
    if (muted || !audio?.base64 || !audio.mimeType) {
      setVoiceState('IDLE');
      return;
    }

    stopPlayback();

    const player = new Audio(
      'data:' + audio.mimeType + ';base64,' + audio.base64
    );
    audioRef.current = player;

    player.onended = () => {
      audioRef.current = null;
      setVoiceState('IDLE');
    };

    player.onerror = () => {
      audioRef.current = null;
      setVoiceState('IDLE');
    };

    try {
      await player.play();
      setVoiceState('SPEAKING');
    } catch {
      setVoiceState('IDLE');
    }
  };

  const processForm = async (form: FormData) => {
    setVoiceState('PROCESSING');
    setErrorMessage('');
    setApprovalCount(0);

    try {
      const res = await fetch('/api/voice/converse', {
        method: 'POST',
        body: form
      });

      const data = (await res.json()) as VoiceResponse;

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || 'Voice request could not be completed.'
        );
      }

      setTranscript(data.transcript || '');
      setMentraResponse(data.message || '');

      const pendingCards = (data.cards || []).filter(
        card => card.requiresApproval
      );
      const pending =
        data.status === 'WAITING_APPROVAL' ||
        pendingCards.length > 0;

      if (pending) {
        setApprovalCount(pendingCards.length || 1);
        setVoiceState('WAITING_APPROVAL');
        return;
      }

      await playResponse(data.audio || null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Voice request failed.'
      );
      setVoiceState('ERROR');
    }
  };

  const startRecording = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setErrorMessage(
        'This browser does not support microphone recording. Use the text box below.'
      );
      setVoiceState('ERROR');
      return;
    }

    stopPlayback();
    setTranscript('');
    setMentraResponse('');
    setErrorMessage('');
    setApprovalCount(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = preferredAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupStream();
        setErrorMessage('Microphone recording failed.');
        setVoiceState('ERROR');
      };

      recorder.onstop = async () => {
        const duration = Math.max(
          1,
          (Date.now() - startedAtRef.current) / 1000
        );

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        cleanupStream();
        recorderRef.current = null;

        if (blob.size === 0) {
          setErrorMessage('No audio was captured.');
          setVoiceState('ERROR');
          return;
        }

        const form = new FormData();
        form.append('audio', blob, 'voice.webm');
        form.append('duration', String(duration));

        await processForm(form);
      };

      recorder.start(250);
      setVoiceState('RECORDING');

      maxTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 60_000);
    } catch (error) {
      cleanupStream();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Microphone permission was denied.'
      );
      setVoiceState('ERROR');
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.stop();
    }
  };

  const toggleRecording = () => {
    if (voiceState === 'RECORDING') {
      stopRecording();
      return;
    }

    if (voiceState === 'PROCESSING') return;
    startRecording();
  };

  const handleTextSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const text = textInput.trim();
    if (!text || voiceState === 'PROCESSING') return;

    stopPlayback();
    setTextInput('');

    const form = new FormData();
    form.append('text', text);
    form.append('duration', '0');

    await processForm(form);
  };

  const reset = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }

    cleanupStream();
    stopPlayback();
    setTranscript('');
    setMentraResponse('');
    setErrorMessage('');
    setApprovalCount(0);
    setVoiceState('IDLE');
  };

  const toggleMute = () => {
    setMuted(current => {
      const next = !current;
      if (next) stopPlayback();
      return next;
    });
  };

  const micClass = () => {
    const base =
      'w-40 h-40 rounded-full border flex flex-col items-center justify-center transition-all ';

    if (voiceState === 'RECORDING') {
      return (
        base +
        'bg-cyan-500 border-cyan-200 text-black shadow-2xl shadow-cyan-500/30 scale-105'
      );
    }

    if (voiceState === 'PROCESSING') {
      return base + 'bg-slate-900 border-cyan-500/40';
    }

    return (
      base +
      'bg-slate-950 border-slate-800 hover:border-cyan-500/50'
    );
  };

  const busy = voiceState === 'PROCESSING';

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-400 mb-8">
            <Radio className="w-3.5 h-3.5" />
            REAL VOICE MODE
          </div>

          <button
            type="button"
            onClick={toggleRecording}
            disabled={busy}
            className={micClass()}
          >
            {voiceState === 'PROCESSING' ? (
              <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
            ) : voiceState === 'RECORDING' ? (
              <Mic className="w-12 h-12" />
            ) : (
              <MicOff className="w-12 h-12 text-slate-400" />
            )}
            <span className="mt-2 text-[11px] font-mono font-bold tracking-widest">
              {voiceState}
            </span>
          </button>

          <p className="mt-5 text-xs text-slate-500">
            {voiceState === 'RECORDING'
              ? 'Speak naturally. Tap again to send.'
              : 'Tap to record Hindi, English, or Hinglish.'}
          </p>

          <div className="w-full max-w-2xl mt-8 p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 text-left min-h-[150px]">
            {transcript ? (
              <div>
                <div className="text-[10px] font-mono tracking-widest text-slate-500">
                  YOU SAID
                </div>
                <p className="mt-2 text-sm sm:text-base text-white">
                  {transcript}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center mt-8">
                Your verified transcript will appear here.
              </p>
            )}

            {mentraResponse && (
              <div className="mt-5 pt-5 border-t border-slate-800">
                <div className="text-[10px] font-mono tracking-widest text-cyan-400">
                  MENTRA
                </div>
                <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {mentraResponse}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {voiceState === 'WAITING_APPROVAL' && (
              <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  {approvalCount} action approval
                  {approvalCount === 1 ? '' : 's'} required
                </div>
                <Link
                  href="/approvals"
                  className="inline-flex mt-3 text-xs text-white underline underline-offset-4"
                >
                  Open Approval Center
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              type="button"
              onClick={toggleMute}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs flex items-center gap-2"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {muted ? 'MUTED' : 'VOICE ON'}
            </button>

            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              RESET
            </button>
          </div>

          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-2xl mt-6 flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={event => setTextInput(event.target.value)}
              placeholder="Text fallback..."
              disabled={busy}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={busy || !textInput.trim()}
              className="p-3 rounded-2xl bg-cyan-500 text-black disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
