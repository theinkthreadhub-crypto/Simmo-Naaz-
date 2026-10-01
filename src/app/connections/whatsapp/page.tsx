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
  Hash
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
  const [activeTab, setActiveTab] = useState<'pair' | 'qr' | 'code'>('pair');

  // 8-Digit Phone Pairing state
  const [pairingPhone, setPairingPhone] = useState('916392995127');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [requestingPair, setRequestingPair] = useState(false);
  const [copiedPairCode, setCopiedPairCode] = useState(false);

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
    } catch {}
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

  useEffect(() => {
    fetchCloudConnection();
    fetchQr();
  }, [fetchCloudConnection, fetchQr]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchCloudConnection();
      fetchQr();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [fetchCloudConnection, fetchQr]);

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
      if (diff === 0) setLinkCode(null);
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

  // Handle Request 8-Digit Pairing Code
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = pairingPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      showToast('error', 'Please enter your valid phone number with country code (e.g. 919839688641)');
      return;
    }

    setRequestingPair(true);
    try {
      const res = await fetch('/api/whatsapp/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhone })
      });
      const data = await res.json();
      if (res.ok && data.pairingCode) {
        setPairingCode(data.pairingCode);
        showToast('success', `8-Digit WhatsApp code generated: ${data.pairingCode}`);
      } else if (data.alreadyConnected) {
        showToast('success', `WhatsApp is already CONNECTED to +${data.connectedNumber || cleanPhone}!`);
        fetchQr();
      } else {
        showToast('error', data.error || data.message || 'Worker is preparing pairing code. Please retry in 3 seconds.');
      }
    } catch {
      showToast('error', 'Failed to reach worker for pairing code.');
    } finally {
      setRequestingPair(false);
    }
  };

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

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp from MENTRA?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession({ ...session, status: 'DISCONNECTED', connectedNumber: null });
        setPairingCode(null);
        setLinkCode(null);
        showToast('success', 'WhatsApp disconnected. You can now link a fresh session.');
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
      showToast('success', 'Requested fresh QR session.');
    } catch {
      showToast('error', 'Failed to request fresh QR session.');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCopyPairCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPairCode(true);
    setTimeout(() => setCopiedPairCode(false), 2000);
  };

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

  const isAsciiQr = useMemo(() => {
    if (!session.qr) return false;
    return session.qr.includes('\n') || session.qr.includes('▄') || session.qr.includes('█');
  }, [session.qr]);

  const qrImageUrl = useMemo(() => {
    if (!session.qr || isAsciiQr) return null;
    return `/api/whatsapp/qr/image?updated=${encodeURIComponent(session.updatedAt || '')}`;
  }, [session.qr, session.updatedAt, isAsciiQr]);

  const isConnected = session.status === 'CONNECTED' || cloudConnection.status === 'CONNECTED';
  const displayPhone = session.connectedNumber || cloudConnection.phone_number || '916392995127';

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
              Link your WhatsApp to chat with MENTRA Gemini AI directly from your phone.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('pair')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pair'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>8-Digit Phone Code</span>
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
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>6-Digit Code</span>
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

        {/* CONNECTED SUCCESS BANNER (Shown if already linked!) */}
        {isConnected && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-8 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">WhatsApp Connected & Active</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold uppercase tracking-wider">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Linked to <span className="text-emerald-400 font-mono font-bold">+{displayPhone}</span>. Bot replies autonomously via Gemini 3.5 Flash!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${displayPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open WhatsApp Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all disabled:opacity-50"
                  title="Disconnect & Re-link"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: 8-DIGIT PHONE PAIRING CODE (Recommended) */}
        {activeTab === 'pair' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Column */}
            <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Connection Method
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                  <span className="text-base font-bold text-white">8-Digit Phone Link</span>
                </div>

                <div className="mt-6 space-y-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    No camera or QR scan needed
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    Works directly on WhatsApp mobile
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    How to use 8-Digit Code:
                  </div>
                  <div className="pl-4 space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                    <p>1. Enter your phone number with country code.</p>
                    <p>2. Tap <b>Generate 8-Digit Code</b>.</p>
                    <p>3. On phone: <b>WhatsApp</b> ➔ <b>Linked Devices</b> ➔ <b>Link a Device</b> ➔ <b>&quot;Link with phone number instead&quot;</b>.</p>
                    <p>4. Type the 8-digit code!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Pairing Action Area */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    Link WhatsApp via 8-Digit Code
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter your phone number to generate an instant 8-character pairing code for WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      WhatsApp Phone Number (with Country Code)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={pairingPhone}
                        onChange={e => setPairingPhone(e.target.value)}
                        placeholder="e.g. 919839688641 (91 + 10-digit number)"
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-sm text-white font-mono placeholder-slate-600"
                      />
                      <button
                        type="submit"
                        disabled={requestingPair || !pairingPhone.trim()}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {requestingPair ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                        <span>{requestingPair ? 'Generating…' : 'Get 8-Digit Code'}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Display 8-Digit Pairing Code */}
                {pairingCode && (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-4 shadow-[0_0_35px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                      Your WhatsApp 8-Digit Pairing Code
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-widest text-emerald-400 font-mono bg-emerald-500/10 px-6 py-3.5 rounded-xl border border-emerald-500/30">
                        {pairingCode}
                      </div>
                      <button
                        onClick={() => handleCopyPairCode(pairingCode)}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
                        title="Copy Code"
                      >
                        {copiedPairCode ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-emerald-400 font-medium">
                      ✓ Ready! Enter this code in WhatsApp on your phone now.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QR SCANNER */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Worker Status Column */}
            <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Scanner Status
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    session.status === 'CONNECTED'
                      ? 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]'
                      : 'bg-cyan-400 animate-pulse'
                  }`}
                />
                <span className="text-lg font-bold text-white tracking-wide">
                  {session.status === 'CONNECTED' ? 'CONNECTED' : 'READY TO SCAN'}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  Auto-sync with Phone
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Gemini 3.5 Flash Connected
                </div>
              </div>

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
                      <pre className="m-0 text-white whitespace-pre select-none font-mono text-[9px] leading-[9px]">
                        {session.qr}
                      </pre>
                    </div>
                  )}

                  <div className="mt-5 text-xs text-slate-400 space-y-2">
                    <p className="text-cyan-300 font-medium">
                      QR refreshes automatically{qrSecondsLeft > 0 ? ` · ${qrSecondsLeft}s remaining` : ''}
                    </p>
                    <p>WhatsApp → Settings / Menu → Linked devices → Link a device</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                    <Hash className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Use 8-Digit Phone Pairing</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                    Camera scan nahi ho raha? Phone number enter karke instant 8-digit pairing code le sakte hain.
                  </p>
                  <button
                    onClick={() => setActiveTab('pair')}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Switch to 8-Digit Phone Code →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 6-DIGIT CODE */}
        {activeTab === 'code' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md text-center space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white mb-1 flex items-center justify-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                6-Digit Verification Code
              </h2>
              <p className="text-xs text-slate-400">
                Generate single-use 15-minute verification code for Meta WhatsApp Cloud API.
              </p>
            </div>

            {!linkCode ? (
              <button
                onClick={handleGenerateCode}
                disabled={generatingCode}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                {generatingCode ? 'Generating…' : 'Generate 6-Digit Link Code'}
              </button>
            ) : (
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-4">
                <div className="text-4xl font-extrabold tracking-widest text-emerald-400 font-mono bg-emerald-500/5 px-6 py-3 rounded-xl border border-emerald-500/30">
                  {linkCode}
                </div>
                <button
                  onClick={() => handleCopyCode(linkCode)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
