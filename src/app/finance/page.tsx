'use client';

import React, { useState } from 'react';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Filter, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import FinanceCard from '@/components/finance/FinanceCard';
import { useMentraStore } from '@/lib/store/mentraStore';
import { FinanceTransaction } from '@/types/mentra';

export default function FinancePage() {
  const { finance, addTransaction } = useMentraStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [category, setCategory] = useState<FinanceTransaction['category']>('BUSINESS_ADS');
  const [scope, setScope] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    addTransaction({
      title,
      amount: Number(amount),
      type,
      category,
      scope,
      notes: 'Logged via Financial HUD'
    });

    setTitle('');
    setAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-mentra-amber font-mono text-xs uppercase tracking-widest">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>CAPITAL VELOCITY & RUNWAY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Financial Command Center
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider shadow-[0_0_20px_rgba(255,74,0,0.4)] hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>RECORD TRANSACTION</span>
        </button>
      </div>

      {/* Main Capital Velocity Card */}
      <FinanceCard summary={finance} />

      {/* Recent Ledger Transactions */}
      <div className="p-6 rounded-3xl glass-panel bg-black/60 border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white">
            RECENT LEDGER ACTIVITY
          </h3>
          <span className="text-xs font-mono text-white/40">
            {finance.transactions.length} ENTRIES
          </span>
        </div>

        <div className="space-y-2.5">
          {finance.transactions.map(tx => (
            <div 
              key={tx.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  tx.type === 'INCOME' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">{tx.title}</div>
                  <div className="text-[10px] font-mono text-white/40 flex items-center gap-2 mt-0.5">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="uppercase text-mentra-amber">{tx.category}</span>
                    <span>•</span>
                    <span>{tx.scope}</span>
                  </div>
                </div>
              </div>

              <div className={`text-sm sm:text-base font-mono font-bold ${
                tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel-orange bg-black/90 border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>LOG FINANCIAL TELEMETRY</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">TRANSACTION TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Meta Ads autumn scale"
                  className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">AMOUNT (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">TYPE</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'EXPENSE' | 'INCOME')}
                    className="w-full bg-[#180703] border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="EXPENSE">EXPENSE (-)</option>
                    <option value="INCOME">INCOME (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FinanceTransaction['category'])}
                    className="w-full bg-[#180703] border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="BUSINESS_ADS">BUSINESS ADS</option>
                    <option value="INVENTORY">INVENTORY</option>
                    <option value="LOGISTICS">LOGISTICS</option>
                    <option value="SOFTWARE">SOFTWARE / AI</option>
                    <option value="LIVING">LIVING / DIET</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">SCOPE</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as 'BUSINESS' | 'PERSONAL')}
                    className="w-full bg-[#180703] border border-white/15 focus:border-mentra-orange rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,74,0,0.4)]"
                >
                  <span>RECORD ENTRY</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
