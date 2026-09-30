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
  WifiOff,
  ScanLine,
  Copy,
  Check,
  Key,
  Unlink,
  ExternalLink,
  Info,
  ArrowRight,
  Terminal
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

interface CloudConnection {
  status: string;
  verified: boolean;
  phone_number: string | null;
  display_phone_number?: string | null;
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
  const [activeTab, setActiveTab] = useState<'code' | 'qr'>('code');

  // Cloud API & Link Code state
  const [cloudConnection, setCloudConnection] = useState<CloudConnection>({
    status: 'NOT_CONFIGURED',
    verified: false,
    phone_number: null
  });
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [codeSecondsLeft, setCodeSecondsLeft] = useState<number>(0);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [directPhone, setDirectPhone] = useState('');
  const [linkingDirect, setLinkingDirect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [botPhoneNumber, setBotPhoneNumber] = useState<string | null>(null);

  // QR Session state
  const [session, setSession] = useState<QrSession>(initialSession);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showTerminalQr, setShowTerminalQr] = useState(false);

  // General toast message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 6000);
  }, []);

  // Fetch Cloud API link connection status
  const fetchCloudConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/link', {
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCloudConfigured(Boolean(data.cloudConfigured));
        setBotPhoneNumber(data.botPhoneNumber || null);
        if (data.connection) {
          setCloudConnection(data.connection);
        }
        if (data.activeCode?.code) {
          setLinkCode(data.activeCode.code);
          setCodeExpiresAt(data.activeCode.expiresAt);
        }
      }
    } catch {
      // Background poll failure
    }
  }, []);

  // Fetch QR session from worker
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
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCloudConnection();
    fetchQr();
  }, [fetchCloudConnection, fetchQr]);

  // Polling intervals
  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchCloudConnection();
      if (activeTab === 'qr') {
        fetchQr();
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [fetchCloudConnection, fetchQr, activeTab]);

  // Countdown timer for 6-Digit Link Code
  useEffect(() => {
    const expiresAt = codeExpiresAt;
    if (!expiresAt) {
      setCodeSecondsLeft(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setCodeSecondsLeft(diff);
      if (diff === 0) {
        setLinkCode(null);
      }
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [codeExpiresAt]);

  // Countdown timer for QR code
  useEffect(() => {
    const expiresAt = session.qrExpiresAt;
    if (!expiresAt) {
      setQrSecondsLeft(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setQrSecondsLeft(diff);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [session.qrExpiresAt]);

  // Generate 6-Digit Link Code
  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_code' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.linkCode) {
        setLinkCode(data.linkCode);
        setCodeExpiresAt(data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString());
        showToast('success', '6-digit WhatsApp link code generated successfully!');
      } else {
        showToast('error', data.error || 'Failed to generate link code');
      }
    } catch {
      showToast('error', 'Network error generating WhatsApp code');
    } finally {
      setGeneratingCode(false);
    }
  };

  // Direct Phone Link
  const handleDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directPhone.replace(/[^0-9]/g, '');
    if (clean.length < 8) {
      showToast('error', 'Please enter a valid phone number with country code (e.g. 919876543210)');
      return;
    }

    setLinkingDirect(true);
    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct_link',
          phoneNumber: clean
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'WhatsApp number linked successfully!');
        setDirectPhone('');
        fetchCloudConnection();
      } else {
        showToast('error', data.error || 'Failed to link phone number');
      }
    } catch {
      showToast('error', 'Network error linking phone number');
    } finally {
      setLinkingDirect(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp from MENTRA?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCloudConnection({
          status: 'DISCONNECTED',
          verified: false,
          phone_number: null
        });
        setLinkCode(null);
        showToast('success', 'WhatsApp disconnected.');
      } else {
        showToast('error', data.error || 'Failed to disconnect.');
      }
    } catch {
      showToast('error', 'Network error disconnecting WhatsApp.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Trigger fresh QR from worker
  const handleRefreshQr = async () => {
    setLoadingQr(true);
    try {
      await fetch('/api/whatsapp/qr', { method: 'POST' });
      await fetchQr();
      showToast('success', 'Requested fresh QR from worker.');
    } catch {
      showToast('error', 'Failed to request fresh QR session.');
    } finally {
      setLoadingQr(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Whether session.qr is pure ASCII block art or raw URL/string
  const isAsciiQr = useMemo(() => {
    if (!session.qr) return false;
    return session.qr.includes('\n') || session.qr.includes('▄') || session.qr.includes('█');
  }, [session.qr]);

  const qrImageUrl = useMemo(() => {
    if (!session.qr) return null;
    if (isAsciiQr) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(session.qr)}`;
  }, [session.qr, isAsciiQr]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-28 selection:bg-emerald-500/30 selection:text-emerald-200">
      <PillNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                WhatsApp Gateway
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Connect your WhatsApp to talk to MENTRA Sovereign AI, receive morning briefs, and automate workflows.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>6-Digit Link Code</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'qr'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>QR Scanner</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Error banner */}
        {requestError && (
          <div className="p-4 rounded-xl mb-6 flex items-center gap-3 text-sm border bg-rose-500/10 border-rose-500/30 text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {/* TAB 1: 6-DIGIT LINK CODE (Live Website & Cloud API) */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Column */}
            <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Gateway Status
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      cloudConnection.status === 'CONNECTED'
                        ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-lg font-bold text-white tracking-wide">
                    {cloudConnection.status === 'CONNECTED' ? 'CONNECTED' : 'NOT LINKED'}
                  </span>
                </div>

                <div className="mt-6 space-y-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Works 24/7 on Live Website
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    Zero background worker needed
                  </div>
                </div>

                {cloudConnection.phone_number && (
                  <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Linked Number
                    </div>
                    <div className="font-mono text-emerald-400 font-semibold">
                      {cloudConnection.display_phone_number || `+${cloudConnection.phone_number}`}
                    </div>
                  </div>
                )}
              </div>

              {cloudConnection.status === 'CONNECTED' && (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                </button>
              )}
            </div>

            {/* Main Action Area */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              {cloudConnection.status === 'CONNECTED' ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">WhatsApp Number Registered</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                    Your number <span className="text-emerald-400 font-mono">+{cloudConnection.phone_number}</span> is saved to your MENTRA profile.
                  </p>

                  {!cloudConfigured && (
                    <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-left max-w-md">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        Meta Cloud API Credentials Missing in Hosting
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        To exchange live messages via WhatsApp Cloud API, you need to configure <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">WHATSAPP_PHONE_NUMBER_ID</code> and <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">WHATSAPP_ACCESS_TOKEN</code> in your Vercel project settings.
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Want instant chat without Meta?</span>
                        <button
                          onClick={() => setActiveTab('qr')}
                          className="text-emerald-400 hover:text-emerald-300 underline font-semibold text-xs"
                        >
                          Switch to QR Scanner →
                        </button>
                      </div>
                    </div>
                  )}

                  {botPhoneNumber && (
                    <a
                      href={`https://wa.me/${botPhoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Chat with MENTRA (+{botPhoneNumber})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      Link via 6-Digit Code
                    </h2>
                    <p className="text-xs text-slate-400">
                      Generate a single-use verification code to connect your WhatsApp directly.
                    </p>
                  </div>

                  {!cloudConfigured && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        Meta WhatsApp Cloud API Status: Config Required
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        The live site does not have Meta Cloud credentials configured yet (<code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">WHATSAPP_PHONE_NUMBER_ID</code>). To connect your personal WhatsApp directly without Meta, use the <b>QR Scanner</b> tab.
                      </p>
                    </div>
                  )}

                  {!linkCode ? (
                    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                      <button
                        onClick={handleGenerateCode}
                        disabled={generatingCode}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <Key className={`w-4 h-4 ${generatingCode ? 'animate-spin' : ''}`} />
                        {generatingCode ? 'Generating Code…' : 'Generate 6-Digit Link Code'}
                      </button>
                      <p className="text-xs text-slate-500 mt-3">
                        Generates a secure 15-minute verification code.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                        Your WhatsApp Link Code
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <div className="text-4xl sm:text-5xl font-extrabold tracking-widest text-emerald-400 font-mono bg-emerald-500/5 px-6 py-3 rounded-xl border border-emerald-500/30">
                          {linkCode.length === 6
                            ? `${linkCode.slice(0, 3)} ${linkCode.slice(3)}`
                            : linkCode}
                        </div>
                        <button
                          onClick={() => handleCopyCode(linkCode)}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Copy Code"
                        >
                          {copiedCode ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-cyan-400 font-mono">
                        Expires in: {formatTimer(codeSecondsLeft)}
                      </div>

                      <div className="border-t border-slate-800/80 pt-4 text-left text-xs text-slate-300 space-y-2">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                          How to complete linking:
                        </div>
                        <div className="text-slate-400 pl-5 space-y-1">
                          <p>1. Open WhatsApp on your phone.</p>
                          <p>2. Send this 6-digit code to the official MENTRA WhatsApp number.</p>
                          <p>3. Or enter your phone number below for instant one-click link.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Direct Phone Number Link Section */}
                  <div className="border-t border-slate-800/80 pt-6">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      Direct WhatsApp Number Link
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Enter your WhatsApp phone number with country code to link it immediately without waiting.
                    </p>

                    <form onSubmit={handleDirectLink} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={directPhone}
                        onChange={e => setDirectPhone(e.target.value)}
                        placeholder="e.g. 919876543210 (Country code + Phone)"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-slate-600 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={linkingDirect || !directPhone.trim()}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {linkingDirect ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{linkingDirect ? 'Linking…' : 'Link Number'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL WHATSAPP WEB QR SCANNER (Worker Mode) */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Worker Status Column */}
            <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Worker Status
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    session.status === 'CONNECTED'
                      ? 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]'
                      : session.workerOnline
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-amber-400'
                  }`}
                />
                <span className="text-lg font-bold text-white tracking-wide">
                  {session.status === 'CONNECTED'
                    ? 'CONNECTED'
                    : session.workerOnline
                      ? 'ONLINE'
                      : 'STANDBY'}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {session.workerOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-400" />
                  )}
                  {session.workerOnline ? 'Worker process online' : 'Worker in standby / offline'}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Personal Self-Chat Mode
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

              <button
                onClick={handleRefreshQr}
                disabled={loadingQr}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                <span>Refresh Session</span>
              </button>
            </div>

            {/* QR Content Area */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              {session.status === 'CONNECTED' ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">WhatsApp Web Connected</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md">
                    Open your WhatsApp chat with yourself (&quot;Message yourself&quot;) to talk directly to MENTRA.
                  </p>
                </div>
              ) : session.status === 'QR_READY' && session.qr ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white mb-4">
                    <ScanLine className="w-4 h-4 text-emerald-400" />
                    Scan with WhatsApp on your Phone
                  </div>

                  {/* Visual QR Code Image */}
                  {qrImageUrl && !showTerminalQr ? (
                    <div className="mx-auto inline-block p-4 rounded-2xl bg-white shadow-2xl shadow-emerald-500/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageUrl}
                        alt="WhatsApp QR Code"
                        width={260}
                        height={260}
                        className="rounded-lg block"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto inline-block rounded-2xl border border-slate-700 bg-black p-3 overflow-hidden max-w-full">
                      <pre
                        aria-label="WhatsApp QR code"
                        className="m-0 text-white whitespace-pre select-none font-mono text-[9px] leading-[9px]"
                      >
                        {session.qr}
                      </pre>
                    </div>
                  )}

                  <div className="mt-5 text-xs text-slate-400 space-y-2">
                    <p className="text-cyan-300 font-medium">
                      QR refreshes automatically{qrSecondsLeft > 0 ? ` · ${qrSecondsLeft}s remaining` : ''}
                    </p>
                    <p>WhatsApp → Settings / Menu → Linked devices → Link a device</p>

                    {isAsciiQr && (
                      <button
                        onClick={() => setShowTerminalQr(!showTerminalQr)}
                        className="text-[11px] text-slate-500 hover:text-slate-300 underline mt-2 block mx-auto"
                      >
                        {showTerminalQr ? 'Switch to Image QR' : 'Switch to Terminal QR'}
                      </button>
                    )}
                  </div>
                </div>
              ) : session.status === 'WAITING_QR' && session.workerOnline ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-5" />
                  <h2 className="text-lg font-semibold text-white">Generating fresh QR code…</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md">
                    Worker is online. Creating a secure WhatsApp Web session payload.
                  </p>
                </div>
              ) : (
                /* Clear Worker Standby State instead of infinite spinner! */
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">WhatsApp Worker in Standby</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                    Personal WhatsApp QR scanning requires the background <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded text-xs">brain-worker</code> process to be running on your machine or server.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => setActiveTab('code')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Use 6-Digit Link Code (Recommended)</span>
                    </button>
                    <button
                      onClick={handleRefreshQr}
                      disabled={loadingQr}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                      <span>Retry Worker</span>
                    </button>
                  </div>

                  <div className="mt-8 text-left p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 max-w-md w-full">
                    <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      To run worker locally:
                    </div>
                    <code className="text-cyan-300 font-mono text-[11px] block bg-slate-900 p-2 rounded mt-1">
                      cd brain-worker && npm install && npm start
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
