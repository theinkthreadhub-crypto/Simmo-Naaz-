'use client';

import React from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import {
  Link2,
  Mail,
  Calendar,
  HardDrive,
  Table,
  Users,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function ConnectionsPage() {
  const integrations = useMentraStore((state) => state.integrations);
  const toggleIntegration = useMentraStore((state) => state.toggleIntegration);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'GMAIL': return <Mail className="w-5 h-5 text-rose-400" />;
      case 'GOOGLE_CALENDAR': return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'GOOGLE_DRIVE': return <HardDrive className="w-5 h-5 text-blue-400" />;
      case 'GOOGLE_SHEETS': return <Table className="w-5 h-5 text-emerald-400" />;
      case 'GOOGLE_CONTACTS': return <Users className="w-5 h-5 text-[#ff8a1f]" />;
      case 'WHATSAPP_CLOUD_API': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      default: return <Link2 className="w-5 h-5 text-[#ff8a1f]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#ff8a1f] font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <Link2 className="w-4 h-4" /> MENTRA DATA GATEWAYS
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">External Integrations</h1>
            <p className="text-white/60 text-sm mt-1">
              Secure OAuth bridges for Google Workspace and WhatsApp Business Cloud API. Real-time encrypted telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> ZERO TOKEN EXPOSURE
          </div>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((int) => (
            <div
              key={int.id}
              className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl hover:border-[#ff8a1f]/50 transition-all flex flex-col justify-between space-y-4 shadow-2xl"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      {getServiceIcon(int.service)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{int.name}</h3>
                      <div className="text-[10px] font-mono text-white/50">{int.accountEmail}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border ${
                      int.status === 'CONNECTED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    {int.status}
                  </span>
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans mb-3">
                  {int.description}
                </p>

                <div className="text-[10px] font-mono text-white/40">
                  LAST SYNC: <span className="text-white/70">{int.lastSync}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => toggleIntegration(int.id)}
                  className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition ${
                    int.status === 'CONNECTED'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
                      : 'btn btn--flame !py-1 !px-3.5 text-xs'
                  }`}
                >
                  {int.status === 'CONNECTED' ? 'Disconnect' : 'Connect Gateway'}
                </button>

                <button className="text-white/40 hover:text-[#ff8a1f] transition p-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
