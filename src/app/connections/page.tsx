'use client';

import React, { useEffect, useState } from 'react';
import { Share2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Key, Shield, MessageSquare, Mail, Calendar, HardDrive, FileSpreadsheet, Users, Sparkles, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface IntegrationItem {
  service: string;
  name: string;
  category: 'GOOGLE' | 'COMMUNICATION' | 'RESEARCH';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ACTION_REQUIRED' | 'TOKEN_EXPIRED';
  accountEmail?: string;
  scopes?: string[];
  lastSync?: string;
  description: string;
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const messageParam = searchParams.get('message');

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    { service: 'GOOGLE_ACCOUNT', name: 'Google Master Identity', category: 'GOOGLE', status: 'DISCONNECTED', description: 'SSO identity, OAuth tokens, and unified workspace permissions.' },
    { service: 'GMAIL', name: 'Gmail Workspace', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Search emails, read thread context, and prepare executive drafts.' },
    { service: 'GOOGLE_CALENDAR', name: 'Google Calendar', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Deep focus time blocking, conflict detection, and event management.' },
    { service: 'GOOGLE_DRIVE', name: 'Google Drive & Docs', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Digital asset indexing, tech packs, and document summarization.' },
    { service: 'GOOGLE_SHEETS', name: 'Google Sheets', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Live spreadsheet analysis and business ledger synchronization.' },
    { service: 'GOOGLE_CONTACTS', name: 'Google Contacts', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Supplier, client, and logistics directory lookup.' },
    { service: 'WHATSAPP_CLOUD_API', name: 'WhatsApp Cloud Gateway', category: 'COMMUNICATION', status: 'DISCONNECTED', description: 'Mobile executive briefings, audio memos, and two-way approvals.' },
    { service: 'LIVE_WEB_RESEARCH', name: 'Live Web Research Engine', category: 'RESEARCH', status: 'CONNECTED', description: 'Multi-source live web search, citation extraction, and trend synthesis.' }
  ]);

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      if (res.ok) {
        const data = await res.json();
        if (data.integrations) {
          setIntegrations(prev => prev.map(item => {
            const match = data.integrations.find((d: any) => d.service === item.service);
            if (match) {
              return {
                ...item,
                status: match.status,
                accountEmail: match.account_email,
                lastSync: match.last_sync_at ? 'Synced' : undefined
              };
            }
            return item;
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = '/api/integrations/google/connect';
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Workspace and revoke access tokens?')) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIntegrations(prev => prev.map(item => 
          item.category === 'GOOGLE' ? { ...item, status: 'DISCONNECTED', accountEmail: undefined } : item
        ));
      }
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'GOOGLE_ACCOUNT': return <Key className="w-5 h-5 text-white" />;
      case 'GMAIL': return <Mail className="w-5 h-5 text-mentra-orange" />;
      case 'GOOGLE_CALENDAR': return <Calendar className="w-5 h-5 text-mentra-amber" />;
      case 'GOOGLE_DRIVE': return <HardDrive className="w-5 h-5 text-cyan-200" />;
      case 'GOOGLE_SHEETS': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'GOOGLE_CONTACTS': return <Users className="w-5 h-5 text-white/70" />;
      case 'WHATSAPP_CLOUD_API': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'LIVE_WEB_RESEARCH': return <Sparkles className="w-5 h-5 text-mentra-orange" />;
      default: return <Share2 className="w-5 h-5 text-mentra-orange" />;
    }
  };

  const isGoogleConnected = integrations.some(i => i.category === 'GOOGLE' && i.status === 'CONNECTED');
  const googleEmail = integrations.find(i => i.category === 'GOOGLE' && i.accountEmail)?.accountEmail;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <Share2 className="w-4 h-4 text-mentra-orange" />
            <span>EXTERNAL INTEGRATION BRIDGES</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Connected Apps & OAuth Gateways
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 px-4 rounded-2xl glass-panel bg-black/60 border-white/10 text-xs font-mono">
            <span className="text-white/40">INTEGRATION STATE: </span>
            <span className={isGoogleConnected ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
              {isGoogleConnected ? 'GOOGLE ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Feedback */}
      {statusParam === 'success' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Google Workspace successfully authenticated and encrypted tokens stored with RLS.</span>
        </div>
      )}

      {statusParam === 'error' && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>OAuth Error: {messageParam || 'Authorization code exchange failed.'}</span>
        </div>
      )}

      {/* Master Google Workspace Controller Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-orange bg-black/70 border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentra-orange/15 border border-mentra-orange/30 text-xs font-mono text-mentra-amber">
            <Shield className="w-3.5 h-3.5 text-mentra-orange" />
            <span>AES-256-GCM ENCRYPTED OAUTH GATEWAY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            Google Workspace Suite
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-sans max-w-2xl">
            Authorize Gmail, Google Calendar, Google Drive, Sheets, and Contacts through a single secure OAuth consent flow. Tokens are encrypted server-side and never exposed to the client.
          </p>
          {isGoogleConnected && googleEmail && (
            <p className="text-xs font-mono text-emerald-400 pt-1">
              Linked Account: <span className="font-bold text-white">{googleEmail}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isGoogleConnected ? (
            <button
              onClick={handleDisconnectGoogle}
              disabled={isDisconnecting}
              className="px-6 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold transition-all disabled:opacity-50"
            >
              {isDisconnecting ? 'DISCONNECTING...' : 'DISCONNECT GOOGLE'}
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black text-xs font-mono font-bold hover:brightness-110 shadow-lg shadow-mentra-orange/20 transition-all flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>CONNECT GOOGLE WORKSPACE</span>
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-widest text-mentra-amber">
          ACTIVE SERVICE CONNECTORS ({integrations.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map(conn => {
            const isConnected = conn.status === 'CONNECTED';
            return (
              <div
                key={conn.service}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isConnected
                    ? 'glass-panel bg-black/60 border-white/15 hover:border-mentra-orange/40'
                    : 'bg-black/40 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      {getServiceIcon(conn.service)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-display text-white">
                        {conn.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/50 border-white/10'
                        }`}>
                          {conn.status}
                        </span>
                        {conn.accountEmail && (
                          <span className="text-[10px] font-mono text-white/40">
                            {conn.accountEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {conn.category === 'GOOGLE' && (
                    <button
                      onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                        isConnected
                          ? 'bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10'
                          : 'bg-gradient-to-r from-mentra-orange to-mentra-amber text-black font-bold'
                      }`}
                    >
                      {isConnected ? 'DISCONNECT' : 'CONNECT'}
                    </button>
                  )}

                  {conn.service === 'WHATSAPP_CLOUD_API' && (
                    <a
                      href="/connections/whatsapp"
                      className="px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                    >
                      <span>GATEWAY</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {conn.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
