'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Mail, FileSpreadsheet, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ApprovalItem {
  id: string;
  tool_name: string;
  tool_input: Record<string, any>;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      if (data.success) {
        setApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (approvalId: string, decision: 'APPROVE' | 'REJECT') => {
    setActionInProgress(approvalId);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, decision })
      });
      const data = await res.json();
      if (data.success) {
        await fetchApprovals();
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Execution error: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const pastApprovals = approvals.filter(a => a.status !== 'PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-mentra-orange" />
            <span>OPERATOR SIGN-OFF GATEWAY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Approval Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl glass-panel bg-black/60 border-white/10 text-xs font-mono">
            <span className="text-white/40">PENDING SIGN-OFFS: </span>
            <span className={`font-bold ${pendingApprovals.length > 0 ? 'text-cyan-400 animate-pulse' : 'text-emerald-400'}`}>
              {pendingApprovals.length}
            </span>
          </div>
        </div>
      </div>

      {/* Security Protocol Banner */}
      <div className="p-5 rounded-2xl glass-panel-orange bg-black/70 border-white/15 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-mentra-orange flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm text-white/80 font-sans">
          <p className="font-semibold text-white">Cryptographic Human-In-The-Loop Protocol</p>
          <p className="text-white/60">
            High-impact operations (sending live emails, mutating financial spreadsheets, deleting assets) are held in quarantine until your explicit authorization. Tokens cannot execute without your cryptographic sign-off.
          </p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-mentra-amber">
          AWAITING YOUR APPROVAL ({pendingApprovals.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-white/40">GATHERING ACTIVE SIGN-OFF QUEUE...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel bg-black/40 border-white/5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
            <p className="text-sm text-white font-medium">All Autonomous Agent Operations Signed Off</p>
            <p className="text-xs text-white/40">No pending external mutations requiring authorization.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map(app => (
              <div key={app.id} className="p-6 rounded-3xl glass-panel-orange bg-black/80 border-mentra-orange/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {app.tool_name === 'sendEmail' ? (
                      <Mail className="w-4 h-4 text-mentra-orange" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-mono text-mentra-amber uppercase tracking-wider font-bold">
                      {app.tool_name.toUpperCase()} ACTION
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span>Expires in 15 mins</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white font-display">{app.description}</h3>
                  
                  {/* Detailed payload preview */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-white/80 space-y-1 overflow-x-auto">
                    {app.tool_name === 'sendEmail' ? (
                      <>
                        <p><strong className="text-mentra-amber">Recipient:</strong> {app.tool_input.to}</p>
                        <p><strong className="text-mentra-amber">Subject:</strong> {app.tool_input.subject}</p>
                        <p className="mt-2 text-white/70 whitespace-pre-wrap"><strong className="text-mentra-amber">Body Preview:</strong><br/>{app.tool_input.body}</p>
                      </>
                    ) : (
                      <pre>{JSON.stringify(app.tool_input, null, 2)}</pre>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleDecision(app.id, 'REJECT')}
                    disabled={actionInProgress === app.id}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    REJECT & CANCEL
                  </button>

                  <button
                    onClick={() => handleDecision(app.id, 'APPROVE')}
                    disabled={actionInProgress === app.id}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-mentra-orange to-mentra-amber text-black text-xs font-mono font-bold hover:brightness-110 shadow-lg shadow-mentra-orange/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionInProgress === app.id ? 'EXECUTING...' : 'AUTHORIZE & SEND'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History */}
      {pastApprovals.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
            AUDIT TRAIL LOG ({pastApprovals.length})
          </h2>
          <div className="space-y-2">
            {pastApprovals.slice(0, 5).map(p => (
              <div key={p.id} className="p-3.5 rounded-xl glass-panel bg-black/40 border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-white/80">{p.description}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
