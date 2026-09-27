'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  ExternalLink,
  Key
} from 'lucide-react';

interface WhatsAppConn {
  status:
    | 'NOT_CONFIGURED'
    | 'READY_TO_CONNECT'
    | 'WAITING_LINK'
    | 'CONNECTED'
    | 'TOKEN_ERROR'
    | 'WEBHOOK_ERROR'
    | 'DISCONNECTED';
  verified: boolean;
  phone_number?: string | null;
  display_phone_number?: string | null;
  last_active_at?: string | null;
}

export default function WhatsAppConnectionPage() {
  const [connection, setConnection] = useState<WhatsAppConn>({
    status: 'NOT_CONFIGURED',
    verified: false,
    phone_number: null
  });
  const [cloudReady, setCloudReady] = useState(false);
  const [officialNumber, setOfficialNumber] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/link', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'WhatsApp status unavailable.');
      }

      setConnection(data.connection);
      setCloudReady(Boolean(data.cloudApiReady));
      setOfficialNumber(data.officialDisplayNumber || null);

      if (data.connection?.status === 'CONNECTED') {
        setLinkCode(null);
        setExpiresIn(0);
      }
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'WhatsApp status unavailable.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  useEffect(() => {
    if (!linkCode) return;
    const poll = setInterval(fetchConnectionStatus, 5000);
    return () => clearInterval(poll);
  }, [linkCode]);

  useEffect(() => {
    if (!linkCode || expiresIn <= 0) return;

    const timer = setInterval(() => {
      setExpiresIn(current => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [linkCode, expiresIn]);

  useEffect(() => {
    if (expiresIn === 0 && linkCode) {
      setLinkCode(null);
    }
  }, [expiresIn, linkCode]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    setToast(null);

    try {
      const res = await fetch('/api/whatsapp/link', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success || !data.linkCode) {
        throw new Error(data.error || 'Failed to generate link code.');
      }

      setLinkCode(data.linkCode);
      setExpiresIn(Number(data.expiresInSeconds || 900));
      setOfficialNumber(data.officialDisplayNumber || officialNumber);
      setToast({
        type: 'success',
        message: 'Single-use WhatsApp link code generated.'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate link code.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp from MENTRA?')) return;

    setDisconnecting(true);
    setToast(null);

    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Disconnect failed.');
      }

      setConnection({
        status: 'DISCONNECTED',
        verified: false,
        phone_number: null
      });
      setToast({
        type: 'success',
        message: 'WhatsApp disconnected.'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Disconnect failed.'
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(expiresIn / 60);
    const seconds = expiresIn % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [expiresIn]);

  const waHref =
    linkCode && officialNumber
      ? `https://wa.me/${officialNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(linkCode)}`
      : null;

  const connected =
    connection.status === 'CONNECTED' && connection.verified;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-300">
          <Smartphone className="w-4 h-4" />
          OFFICIAL META CLOUD API
        </div>
        <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-white">
          WhatsApp
        </h1>
        <p className="mt-2 text-sm text-white/45 max-w-2xl">
          Real two-way MENTRA chat, delivery tracking, and proactive alerts.
          Outside Meta&apos;s customer-service window, proactive messages require
          approved WhatsApp templates.
        </p>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl border text-sm flex gap-2 ${toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
        <section className="p-5 rounded-3xl border border-white/10 bg-black/45">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-white/40">Connection status</div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${connected
                      ? 'bg-emerald-400'
                      : cloudReady
                        ? 'bg-amber-300'
                        : 'bg-rose-400'
                  }`}
                />
                <span className="font-semibold text-white">
                  {connected
                    ? 'CONNECTED'
                    : cloudReady
                      ? 'READY TO LINK'
                      : 'SETUP REQUIRED'}
                </span>
              </div>
            </div>

            <button
              onClick={fetchConnectionStatus}
              disabled={loading}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/55 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {connected && connection.phone_number && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[10px] text-emerald-300 font-mono">
                LINKED OPERATOR NUMBER
              </div>
              <div className="mt-1 text-sm font-mono text-white">
                {connection.display_phone_number ||
                  `+${connection.phone_number}`}
              </div>
              {connection.last_active_at && (
                <div className="mt-2 text-[10px] text-white/35">
                  Last inbound:{' '}
                  {new Date(connection.last_active_at).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {!cloudReady && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100/80">
              Meta Cloud API credentials/webhook are not configured. MENTRA
              will not pretend WhatsApp is connected.
            </div>
          )}

          {connected && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="mt-5 w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Unlink className="w-4 h-4" />
              {disconnecting ? 'DISCONNECTING…' : 'DISCONNECT'}
            </button>
          )}
        </section>

        <section className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-black/45">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 h-fit text-emerald-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">
                Secure phone linking
              </h2>
              <p className="mt-1 text-xs leading-5 text-white/45">
                A 6-digit code is single-use and expires after 15 minutes.
                Sending it from WhatsApp binds that phone to your authenticated
                MENTRA account.
              </p>
            </div>
          </div>

          {connected ? (
            <div className="mt-6 p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
              <div className="flex gap-2 items-center text-emerald-200 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Verified channel active
              </div>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Text commands, approval replies, quest completion shortcuts,
                delivery receipts, and configured proactive alerts are enabled.
              </p>
            </div>
          ) : !linkCode ? (
            <button
              onClick={handleGenerateCode}
              disabled={!cloudReady || generating}
              className="mt-6 w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 text-black text-sm font-semibold disabled:opacity-40"
            >
              {generating ? 'GENERATING…' : 'GENERATE 6-DIGIT CODE'}
            </button>
          ) : (
            <div className="mt-6 p-5 rounded-2xl border border-emerald-500/30 bg-black/60 text-center">
              <div className="text-[10px] font-mono text-white/40">
                SINGLE-USE CODE
              </div>
              <div className="mt-2 text-4xl font-mono font-bold tracking-[0.25em] text-emerald-300">
                {linkCode}
              </div>
              <div className="mt-2 text-xs text-amber-200">
                Expires in {formattedTimer}
              </div>

              {officialNumber ? (
                <>
                  <p className="mt-5 text-xs text-white/50">
                    Send this code from your phone to the configured MENTRA
                    WhatsApp number: {officialNumber}
                  </p>
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-semibold"
                    >
                      OPEN WHATSAPP
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-5 text-xs text-amber-200">
                  Business display number is missing from server
                  configuration. Add it before linking.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
