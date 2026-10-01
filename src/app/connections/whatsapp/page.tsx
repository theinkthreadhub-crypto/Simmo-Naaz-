'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  ScanLine,
  Unlink
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
  workerOnline: boolean;
  workerLastSeen: string | null;
}

const initialSession: QrSession = {
  status: 'DISCONNECTED',
  qr: null,
  qrExpiresAt: null,
  connectedNumber: null,
  connectedAt: null,
  lastError: null,
  updatedAt: null,
  workerOnline: false,
  workerLastSeen: null
};

export default function WhatsAppConnectionPage() {
  const [session, setSession] = useState<QrSession>(initialSession);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const lastQrRequestAt = useRef(0);

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
        status: data.status || 'DISCONNECTED',
        qr: data.qr || null,
        qrExpiresAt: data.qrExpiresAt || null,
        connectedNumber: data.connectedNumber || null,
        connectedAt: data.connectedAt || null,
        lastError: data.lastError || null,
        updatedAt: data.updatedAt || null,
        workerOnline: Boolean(data.workerOnline),
        workerLastSeen: data.workerLastSeen || null
      });
      setRequestError(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to load WhatsApp QR');
    } finally {
      setInitialLoaded(true);
    }
  }, []);

  const requestFreshQr = useCallback(async (force = false) => {
    if (loadingQr) return;

    const now = Date.now();
    if (!force && now - lastQrRequestAt.current < 20_000) return;
    lastQrRequestAt.current = now;

    setLoadingQr(true);
    setRequestError(null);

    try {
      const res = await fetch('/api/whatsapp/qr', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Unable to generate fresh QR');
      }

      await fetchQr();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to generate fresh QR');
    } finally {
      setLoadingQr(false);
    }
  }, [fetchQr, loadingQr]);

  useEffect(() => {
    fetchQr();
    const timer = window.setInterval(fetchQr, 3000);
    return () => window.clearInterval(timer);
  }, [fetchQr]);

  useEffect(() => {
    const expiresAt = session.qrExpiresAt;

    if (!expiresAt) {
      setQrSecondsLeft(0);
      return;
    }

    const update = () => {
      const diff = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setQrSecondsLeft(diff);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session.qrExpiresAt]);

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp from MENTRA?')) return;

    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to disconnect WhatsApp');
      }

      setSession(initialSession);
      await requestFreshQr(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to disconnect WhatsApp');
    } finally {
      setDisconnecting(false);
    }
  };

  const isAsciiQr = useMemo(() => {
    if (!session.qr) return false;
    return session.qr.includes('\n') || session.qr.includes('▄') || session.qr.includes('█');
  }, [session.qr]);

  const qrImageUrl = useMemo(() => {
    if (!session.qr || isAsciiQr) return null;
    return `/api/whatsapp/qr/image?updated=${encodeURIComponent(session.updatedAt || '')}`;
  }, [session.qr, session.updatedAt, isAsciiQr]);

  const isConnected = session.status === 'CONNECTED';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-28 selection:bg-emerald-500/30 selection:text-emerald-200">
      <PillNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28">
        <div className="border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                WhatsApp QR Connect
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                MENTRA now uses only one connection method: WhatsApp QR.
              </p>
            </div>
          </div>
        </div>

        {requestError && (
          <div className="p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border bg-rose-500/10 border-rose-500/30 text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {isConnected ? (
          <div className="p-7 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">WhatsApp Connected</h2>
            <p className="text-sm text-slate-400 mt-2">
              MENTRA will respond only in your own “Message Yourself” chat.
            </p>
            {session.connectedNumber && (
              <p className="text-xs text-emerald-300 font-mono mt-3">
                +{session.connectedNumber}
              </p>
            )}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold disabled:opacity-50"
            >
              <Unlink className="w-4 h-4" />
              {disconnecting ? 'Disconnecting…' : 'Change WhatsApp Number'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Connection
              </span>

              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    session.workerOnline
                      ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.7)]'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="text-base font-bold text-white">
                  {session.workerOnline ? 'Worker Online' : 'Waking Worker'}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Owner-only replies
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  Auto QR refresh
                </div>
              </div>

              <button
                onClick={() => requestFreshQr(true)}
                disabled={loadingQr}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                {loadingQr ? 'Generating…' : 'Generate Fresh QR'}
              </button>
            </div>

            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[420px] flex items-center justify-center">
              {!initialLoaded ? (
                <div className="text-center">
                  <RefreshCw className="w-10 h-10 mx-auto text-emerald-400 animate-spin" />
                  <h2 className="text-lg font-semibold text-white mt-5">Loading QR status…</h2>
                </div>
              ) : session.status === 'QR_READY' && session.qr ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white mb-4">
                    <ScanLine className="w-4 h-4 text-emerald-400" />
                    Scan this QR with WhatsApp
                  </div>

                  {qrImageUrl ? (
                    <div className="mx-auto inline-block p-4 rounded-2xl bg-white shadow-2xl shadow-emerald-500/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageUrl}
                        alt="WhatsApp QR Code"
                        width={340}
                        height={340}
                        className="block max-w-[82vw]"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ) : (
                    <div className="mx-auto inline-block rounded-2xl border border-slate-700 bg-black p-3 overflow-hidden max-w-full">
                      <pre className="m-0 text-white whitespace-pre select-none font-mono text-[9px] leading-[9px]">
                        {session.qr}
                      </pre>
                    </div>
                  )}

                  <div className="mt-5 text-xs text-slate-400 space-y-2">
                    <p className="text-cyan-300 font-medium">
                      {qrSecondsLeft > 0
                        ? `QR refreshes automatically · ${qrSecondsLeft}s remaining`
                        : 'Refreshing QR automatically…'}
                    </p>
                    <p>WhatsApp → Linked Devices → Link a Device → Scan QR</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <RefreshCw className="w-10 h-10 mx-auto text-emerald-400 animate-spin" />
                  <h2 className="text-lg font-semibold text-white mt-5">
                    Waiting for fresh QR…
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    The worker rotates WhatsApp QR automatically. If it does not appear, tap Generate Fresh QR once.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
