'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  ScanLine
} from 'lucide-react';

type QrStatus =
  | 'WAITING_QR'
  | 'QR_READY'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR';

interface QrSession {
  status: QrStatus;
  qr: string | null;
  qrExpiresAt: string | null;
  connectedNumber: string | null;
  connectedAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

const initialSession: QrSession = {
  status: 'WAITING_QR',
  qr: null,
  qrExpiresAt: null,
  connectedNumber: null,
  connectedAt: null,
  lastError: null,
  updatedAt: null
};

export default function WhatsAppConnectionPage() {
  const [session, setSession] = useState<QrSession>(initialSession);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);

  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/qr', {
        cache: 'no-store',
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load WhatsApp QR');
      }

      setSession({
        status: data.status || 'WAITING_QR',
        qr: data.qr || null,
        qrExpiresAt: data.qrExpiresAt || null,
        connectedNumber: data.connectedNumber || null,
        connectedAt: data.connectedAt || null,
        lastError: data.lastError || null,
        updatedAt: data.updatedAt || null
      });
      setRequestError(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to load WhatsApp QR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQr();
    const timer = window.setInterval(fetchQr, 2000);
    return () => window.clearInterval(timer);
  }, [fetchQr]);

  useEffect(() => {
    const updateCountdown = () => {
      if (!session.qrExpiresAt) {
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(
        Math.max(0, Math.ceil((new Date(session.qrExpiresAt).getTime() - Date.now()) / 1000))
      );
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [session.qrExpiresAt]);

  const statusLabel = useMemo(() => {
    if (session.status === 'CONNECTED') return 'CONNECTED';
    if (session.status === 'QR_READY' && session.qr) return 'SCAN QR';
    if (session.status === 'ERROR') return 'ERROR';
    return 'CONNECTING';
  }, [session.status, session.qr]);

  const statusDot = session.status === 'CONNECTED'
    ? 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]'
    : session.status === 'ERROR'
      ? 'bg-rose-400'
      : 'bg-cyan-400 animate-pulse';

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                WhatsApp Self-Chat
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Link your WhatsApp device once, then message yourself to talk to MENTRA.
            </p>
          </div>

          <button
            onClick={fetchQr}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
            Refresh QR
          </button>
        </div>

        {requestError && (
          <div className="p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border bg-rose-500/10 border-rose-500/30 text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Worker Status
            </span>
            <div className="mt-3 flex items-center gap-3">
              <span className={'w-3 h-3 rounded-full ' + statusDot} />
              <span className="text-lg font-bold text-white tracking-wide">
                {statusLabel}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                Secure worker online
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                QR stays inside MENTRA infrastructure
              </div>
            </div>

            {session.connectedNumber && (
              <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  Linked Number
                </div>
                <div className="font-mono text-emerald-400">
                  +{session.connectedNumber}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            {session.status === 'CONNECTED' ? (
              <div className="min-h-[390px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">WhatsApp Connected</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Open your own WhatsApp chat and send a message. MENTRA will reply there.
                </p>
              </div>
            ) : session.status === 'QR_READY' && session.qr ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white mb-4">
                  <ScanLine className="w-4 h-4 text-emerald-400" />
                  Scan with WhatsApp
                </div>

                <div className="mx-auto inline-block rounded-2xl border border-slate-700 bg-black p-3 overflow-hidden max-w-full">
                  <pre
                    aria-label="WhatsApp QR code"
                    className="m-0 text-white whitespace-pre select-none"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '9px',
                      lineHeight: '9px',
                      letterSpacing: '0px'
                    }}
                  >
                    {session.qr}
                  </pre>
                </div>

                <div className="mt-5 text-xs text-slate-400 space-y-2">
                  <p className="text-cyan-300">
                    QR refreshes automatically{secondsLeft > 0 ? ' · ' + secondsLeft + 's remaining' : ''}
                  </p>
                  <p>WhatsApp → Settings/Menu → Linked devices → Link a device</p>
                  <p>Scan this QR from your phone.</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[390px] flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-5" />
                <h2 className="text-lg font-semibold text-white">Preparing secure QR…</h2>
                <p className="text-sm text-slate-400 mt-2">
                  The WhatsApp worker is creating a fresh pairing session.
                </p>
                {session.lastError && (
                  <div className="mt-5 max-w-lg p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    {session.lastError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
