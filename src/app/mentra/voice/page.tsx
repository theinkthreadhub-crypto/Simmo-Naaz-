'use client';

import React, { useState, useEffect, useRef } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Send,
  Radio
} from 'lucide-react';

type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'USING_TOOL'
  | 'SPEAKING'
  | 'WAITING_APPROVAL'
  | 'ERROR';

export default function MentraVoicePage() {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [confirmedText, setConfirmedText] = useState('');
  const [mentraResponse, setMentraResponse] = useState('');
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [textInput, setTextInput] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API for real-time live browser transcription
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Multi-lingual (Hindi / English / Hinglish)

      recognition.onstart = () => {
        setVoiceState('LISTENING');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setConfirmedText(final);
          setLiveTranscript(final);
          handleProcessVoiceCommand(final);
        } else {
          setLiveTranscript(interim);
        }
      };

      recognition.onerror = () => {
        setVoiceState('IDLE');
      };

      recognition.onend = () => {
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (voiceState === 'LISTENING') {
      recognitionRef.current?.stop();
      setVoiceState('IDLE');
    } else {
      setLiveTranscript('');
      setConfirmedText('');
      setMentraResponse('');
      try {
        recognitionRef.current?.start();
        setVoiceState('LISTENING');
      } catch {
        setVoiceState('LISTENING');
      }
    }
  };

  const handleProcessVoiceCommand = async (command: string) => {
    if (!command.trim()) return;

    recognitionRef.current?.stop();
    setVoiceState('THINKING');
    setCurrentTool('ANALYZING INTENT');

    try {
      const res = await fetch('/api/mentra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command, channel: 'WEB' })
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMentraResponse(data.message);
        setVoiceState('SPEAKING');
        setCurrentTool(null);

        // Native TTS if enabled and not muted
        if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.message.replace(/[*_#]/g, ''));
          utterance.lang = 'hi-IN';
          utterance.onend = () => setVoiceState('IDLE');
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setVoiceState('IDLE'), 3000);
        }
      } else {
        setMentraResponse(data.error || 'Unable to process voice request.');
        setVoiceState('ERROR');
      }
    } catch {
      setMentraResponse('Network connectivity error.');
      setVoiceState('ERROR');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setConfirmedText(textInput);
    handleProcessVoiceCommand(textInput);
    setTextInput('');
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 flex flex-col items-center justify-center text-center">
        {/* Header Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-400 mb-8 backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>SOVEREIGN VOICE INTERACTION</span>
        </div>

        {/* Central Radial Energy Core */}
        <div className="relative my-8 flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div
            className={`absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full transition-all duration-700 ${
              voiceState === 'LISTENING'
                ? 'bg-cyan-500/20 scale-125 blur-3xl animate-pulse'
                : voiceState === 'SPEAKING'
                ? 'bg-mentra-orange/20 scale-110 blur-3xl'
                : voiceState === 'THINKING'
                ? 'bg-cyan-500/20 scale-100 blur-2xl animate-spin'
                : 'bg-white/5 scale-90 blur-xl'
            }`}
          />

          {/* Main Microphone Core Orb */}
          <button
            onClick={toggleListening}
            className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border ${
              voiceState === 'LISTENING'
                ? 'bg-gradient-to-tr from-cyan-600 to-teal-400 border-cyan-300 shadow-cyan-500/50 scale-105'
                : voiceState === 'SPEAKING'
                ? 'bg-gradient-to-tr from-mentra-orange to-mentra-amber border-indigo-300 shadow-indigo-500/50'
                : voiceState === 'THINKING'
                ? 'bg-slate-900 border-cyan-400/50 shadow-cyan-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            {voiceState === 'LISTENING' ? (
              <Mic className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <MicOff className="w-12 h-12 text-slate-400 hover:text-white" />
            )}
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/90 mt-2 font-bold">
              {voiceState}
            </span>
          </button>
        </div>

        {/* Action / Tool Execution Chip */}
        {currentTool && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>ACTION: {currentTool}</span>
          </div>
        )}

        {/* Live Transcript Display Box */}
        <div className="w-full max-w-2xl min-h-[120px] p-6 rounded-3xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-center items-center my-4 text-center">
          {liveTranscript || confirmedText ? (
            <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
              &ldquo;{liveTranscript || confirmedText}&rdquo;
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500">
              Tap the sovereign core or speak naturally in Hindi, English, or Hinglish...
            </p>
          )}

          {mentraResponse && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 w-full text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MENTRA SOVEREIGN INTEL</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {mentraResponse}
              </p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setMuted(!muted)}
            className={`p-3 rounded-2xl border text-xs font-mono flex items-center gap-2 transition-all ${
              muted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? 'TTS MUTED' : 'VOICE ACTIVE'}</span>
          </button>

          <button
            onClick={() => {
              setLiveTranscript('');
              setConfirmedText('');
              setMentraResponse('');
              setVoiceState('IDLE');
            }}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>

        {/* Text Fallback Input */}
        <form onSubmit={handleTextSubmit} className="w-full max-w-2xl mt-6 flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type your command (e.g. ₹500 ads expense add karo)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
