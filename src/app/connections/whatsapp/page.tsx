'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  ExternalLink,
  MessageSquare,
  Key
} from 'lucide-react';

interface WhatsAppConn {
  status: 'NOT_CONFIGURED' | 'READY_TO_CONNECT' | 'WAITING_LINK' | 'CONNECTED' | 'TOKEN_ERROR' | 'DISCONNECTED';
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

  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  useEffect(() => {
    if (!expiresIn || expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/link');
      const data = await res.json();
      if (data.success && data.connection) {
        setConnection(data.connection);
      }
    } catch (e) {
      console.error('Failed to fetch connection status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    setToast(null);
    try {
      const res = await fetch('/api/whatsapp/link', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.linkCode) {
        setLinkCode(data.linkCode);
        setExpiresIn(15 * 60); // 15 minutes
        setToast({ type: 'success', message: 'Verification link code generated.' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to generate link code.' });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Network error generating code.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp from MENTRA?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConnection({ status: 'DISCONNECTED', verified: false, phone_number: null });
        setLinkCode(null);
        setToast({ type: 'success', message: 'WhatsApp disconnected successfully.' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to disconnect.' });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Network error disconnecting WhatsApp.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-28">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                WhatsApp Sovereign Gateway
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Official Meta WhatsApp Cloud API bridge. Access MENTRA Core 24/7 without opening the browser.
            </p>
          </div>

          <button
            onClick={fetchConnectionStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connection Status Card */}
          <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Status
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    connection.status === 'CONNECTED'
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                      : 'bg-cyan-500'
                  }`}
                />
                <span className="text-lg font-bold text-white tracking-wide">
                  {connection.status === 'CONNECTED' ? 'CONNECTED' : 'NOT LINKED'}
                </span>
              </div>

              {connection.phone_number && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-1">Linked Phone</div>
                  <div className="font-mono text-emerald-400 font-medium">
                    {connection.display_phone_number || `+${connection.phone_number}`}
                  </div>
                </div>
              )}
            </div>

            {connection.status === 'CONNECTED' && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all"
              >
                <Unlink className="w-4 h-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect WhatsApp'}
              </button>
            )}
          </div>

          {/* Verification / Linking Flow Card */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Secure Account Linking Protocol
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              To prevent unauthorized access, MENTRA uses an ephemeral single-use 6-digit cryptographic handshake.
            </p>

            {connection.status === 'CONNECTED' ? (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  WhatsApp Sovereign Channel Verified
                </div>
                <p className="text-slate-300">
                  You can now send natural language commands, log expenses, complete quests with &quot;1 done&quot;, receive morning briefs, and practice public speaking directly over WhatsApp.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {!linkCode ? (
                  <div>
                    <button
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Smartphone className="w-4 h-4" />
                      {generating ? 'Generating Link Code...' : 'Generate 6-Digit Link Code'}
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      Your Single-Use Verification Code
                    </div>
                    <div className="text-4xl font-extrabold tracking-widest text-emerald-400 font-mono">
                      {linkCode}
                    </div>
                    <div className="text-xs text-cyan-400">
                      Expires in: {expiresIn ? formatTimer(expiresIn) : '0:00'}
                    </div>

                    <div className="border-t border-slate-800 pt-4 text-left text-xs text-slate-300 space-y-2">
                      <div className="font-semibold text-white">Next Steps:</div>
                      <div>1. Open WhatsApp on your mobile device.</div>
                      <div>2. Send this 6-digit code to the official MENTRA WhatsApp number.</div>
                      <div>3. Webhook will immediately verify and bind your sovereign session.</div>
                    </div>
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
