'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Share2, CheckCircle2, AlertCircle, RefreshCw, Key, Mail,
  Calendar, HardDrive, FileSpreadsheet, Users, MessageSquare, Sparkles
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Status =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ACTION_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'CONFIG_REQUIRED'
  | 'CODE_READY'
  | 'NOT_CONFIGURED'
  | 'DEGRADED'
  | 'DISABLED'
  | 'CHECKING';

type Item = {
  service: string;
  name: string;
  category: 'GOOGLE' | 'COMMUNICATION' | 'RESEARCH';
  status: Status;
  accountEmail?: string;
  description: string;
};

const BASE: Item[] = [
  { service: 'GOOGLE_ACCOUNT', name: 'Google Workspace', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Verified OAuth identity and encrypted offline token.' },
  { service: 'GMAIL', name: 'Gmail', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Search/read mail, create drafts, and approval-gated sending.' },
  { service: 'GOOGLE_CALENDAR', name: 'Google Calendar', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Read events, detect conflicts, and approval-gated event creation.' },
  { service: 'GOOGLE_DRIVE', name: 'Google Drive', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Search authorized files and read supported text documents.' },
  { service: 'GOOGLE_SHEETS', name: 'Google Sheets', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Read ranges and approval-gated row appends.' },
  { service: 'GOOGLE_CONTACTS', name: 'Google Contacts', category: 'GOOGLE', status: 'DISCONNECTED', description: 'Search authorized People/Contacts records.' },
  { service: 'WHATSAPP_CLOUD_API', name: 'WhatsApp Gateway', category: 'COMMUNICATION', status: 'DISCONNECTED', description: 'Two-way WhatsApp channel after provider setup and linking.' },
  { service: 'LIVE_WEB_RESEARCH', name: 'Live Web Research', category: 'RESEARCH', status: 'DISCONNECTED', description: 'Live evidence-backed research with source citations.' }
];

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>(BASE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleTokenPresent, setGoogleTokenPresent] = useState(false);
  const [googleRefreshAvailable, setGoogleRefreshAvailable] = useState(false);
  const [googleConfigStatus, setGoogleConfigStatus] = useState<Status>('CHECKING');

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statusRes, healthRes] = await Promise.all([
        fetch('/api/integrations/status', { cache: 'no-store' }),
        fetch('/api/system/health', { cache: 'no-store' })
      ]);

      const statusData = await statusRes.json();
      const healthData = await healthRes.json();

      if (!statusRes.ok) {
        throw new Error(statusData.error || 'Integration status unavailable.');
      }

      const rows = statusData.integrations || [];
      const googleHealth = statusData.google || {};
      const configStatus =
        healthData?.capabilities?.google_workspace?.status || 'CONFIG_REQUIRED';

      setGoogleTokenPresent(Boolean(googleHealth.tokenPresent));
      setGoogleRefreshAvailable(Boolean(googleHealth.refreshAvailable));
      setGoogleConfigStatus(configStatus);

      const googleEmail = rows.find((row: any) =>
        row.provider === 'GOOGLE' && row.account_email
      )?.account_email;

      const whatsappStatus =
        healthData?.capabilities?.whatsapp_cloud?.status || 'CONFIG_REQUIRED';
      const researchStatus =
        healthData?.capabilities?.live_research?.status || 'CONFIG_REQUIRED';

      setItems(BASE.map(item => {
        const direct = rows.find((row: any) => row.service === item.service);

        if (direct) {
          return {
            ...item,
            status: direct.status || 'DISCONNECTED',
            accountEmail: direct.account_email || googleEmail
          };
        }

        if (item.category === 'GOOGLE') {
          return {
            ...item,
            status:
              configStatus === 'DISABLED' || configStatus === 'CONFIG_REQUIRED'
                ? configStatus
                : 'DISCONNECTED',
            accountEmail: googleEmail
          };
        }

        if (item.service === 'WHATSAPP_CLOUD_API') {
          return { ...item, status: whatsappStatus };
        }

        if (item.service === 'LIVE_WEB_RESEARCH') {
          return { ...item, status: researchStatus };
        }

        return item;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Integration status unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const connected = items.filter(item => item.status === 'CONNECTED').length;
  const googleRows = useMemo(
    () => items.filter(item => item.category === 'GOOGLE'),
    [items]
  );
  const googleFullyConnected =
    googleTokenPresent &&
    googleRows.length > 0 &&
    googleRows.every(item => item.status === 'CONNECTED');

  const disconnect = async () => {
    if (!confirm('Disconnect Google Workspace and remove stored OAuth tokens?')) return;

    const response = await fetch('/api/integrations/google/disconnect', {
      method: 'POST'
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.error || 'Disconnect failed.');
      return;
    }

    await load();
  };

  const connectDisabled =
    googleConfigStatus === 'DISABLED' ||
    googleConfigStatus === 'CONFIG_REQUIRED';

  const icon = (service: string) =>
    service === 'GMAIL' ? <Mail className="w-5 h-5" /> :
    service === 'GOOGLE_CALENDAR' ? <Calendar className="w-5 h-5" /> :
    service === 'GOOGLE_DRIVE' ? <HardDrive className="w-5 h-5" /> :
    service === 'GOOGLE_SHEETS' ? <FileSpreadsheet className="w-5 h-5" /> :
    service === 'GOOGLE_CONTACTS' ? <Users className="w-5 h-5" /> :
    service === 'WHATSAPP_CLOUD_API' ? <MessageSquare className="w-5 h-5" /> :
    service === 'LIVE_WEB_RESEARCH' ? <Sparkles className="w-5 h-5" /> :
    <Key className="w-5 h-5" />;

  const statusClass = (status: Status) =>
    status === 'CONNECTED' ? 'text-emerald-400' :
    status === 'CODE_READY' ? 'text-cyan-300' :
    status === 'ACTION_REQUIRED' || status === 'TOKEN_EXPIRED' || status === 'CONFIG_REQUIRED'
      ? 'text-amber-300'
      : status === 'DISABLED'
        ? 'text-rose-300'
        : 'text-white/40';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-7">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono text-mentra-amber tracking-widest flex gap-2">
            <Share2 className="w-4 h-4" />REAL INTEGRATION STATUS
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">Connections</h1>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-white/45">{connected}/{items.length} connected</span>
          <button onClick={load} disabled={loading} className="p-2 rounded-xl bg-white/5 border border-white/10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {searchParams.get('status') === 'success' && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 flex gap-2">
          <CheckCircle2 className="w-4 h-4" />Google Workspace connected with required scopes.
        </div>
      )}

      {searchParams.get('status') === 'partial' && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex gap-2">
          <AlertCircle className="w-4 h-4" />Google connected, but one or more requested permissions were not granted. Reconnect to complete access.
        </div>
      )}

      {searchParams.get('status') === 'error' && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 flex gap-2">
          <AlertCircle className="w-4 h-4" />
          {searchParams.get('message') || 'Connection failed.'}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200">
          {error}
        </div>
      )}

      <div className="p-5 rounded-3xl border border-white/10 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">Google Workspace</h2>
          <p className="mt-1 text-sm text-white/50">
            {googleFullyConnected
              ? 'OAuth token verified. Gmail, Calendar, Drive, Sheets and Contacts are authorized.'
              : googleTokenPresent
                ? `Google token exists${googleRefreshAvailable ? ' with offline refresh' : ''}, but some services require action.`
                : connectDisabled
                  ? 'Google OAuth server configuration is not ready.'
                  : 'Not connected. Authorize your Google account to use real Workspace data.'}
          </p>
        </div>

        {googleTokenPresent ? (
          <div className="flex gap-2">
            {!googleFullyConnected && (
              <button
                onClick={() => { window.location.href = '/api/integrations/google/connect'; }}
                className="px-5 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold"
              >
                REAUTHORIZE
              </button>
            )}
            <button
              onClick={disconnect}
              className="px-5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold"
            >
              DISCONNECT
            </button>
          </div>
        ) : (
          <button
            disabled={connectDisabled}
            onClick={() => { window.location.href = '/api/integrations/google/connect'; }}
            className="px-5 py-2.5 rounded-xl bg-mentra-orange text-white text-xs font-semibold disabled:opacity-40"
          >
            {connectDisabled ? 'SETUP REQUIRED' : 'CONNECT GOOGLE'}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.service} className="p-5 rounded-2xl border border-white/10 bg-black/45">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 text-mentra-amber">
                  {icon(item.service)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <div className={`mt-1 text-[10px] font-mono ${statusClass(item.status)}`}>
                    {item.status}
                  </div>
                </div>
              </div>

              {item.service === 'WHATSAPP_CLOUD_API' && (
                <Link href="/connections/whatsapp" className="text-xs text-cyan-300">
                  Open
                </Link>
              )}
            </div>

            <p className="mt-3 text-xs text-white/50">{item.description}</p>
            {item.accountEmail && (
              <div className="mt-2 text-[11px] text-white/35">{item.accountEmail}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
