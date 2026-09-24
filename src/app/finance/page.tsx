'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles
} from 'lucide-react';

export default function FinancePage() {
  const finance = useMentraStore((state) => state.finance);
  const addTransaction = useMentraStore((state) => state.addTransaction);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [scope, setScope] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [category, setCategory] = useState<any>('BUSINESS_ADS');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    addTransaction({
      title,
      amount: parseFloat(amount),
      type,
      category,
      scope,
      notes: 'Logged via Financial HUD'
    });
    setTitle('');
    setAmount('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-[#120400] text-slate-100 flex flex-col pt-16">
      <HUDOverlay />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
              <DollarSign className="w-4 h-4" /> MENTRA FINANCIAL TELEMETRY
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Financial Command HUD</h1>
            <p className="text-white/60 text-sm mt-1">
              Real-time cash velocity, unit economics, budget allocations, and automated AI burn rate sentinel.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn--flame !py-2.5 !px-5 text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Record Transaction
          </button>
        </div>

        {/* Command Bar */}
        <CommandBar />

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
              <span>MONTHLY REVENUE</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{formatCurrency(finance.monthlyIncome)}</div>
            <div className="text-[11px] text-white/40 mt-1 font-mono">+18.4% vs baseline</div>
          </div>

          <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
              <span>MONTHLY EXPENSES</span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400">{formatCurrency(finance.monthlyExpenses)}</div>
            <div className="text-[11px] text-white/40 mt-1 font-mono">68% Ads & Supply Chain</div>
          </div>

          <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
              <span>NET SAVINGS BUFFER</span>
              <TrendingUp className="w-4 h-4 text-[#ff8a1f]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#ff8a1f]">{formatCurrency(finance.monthlySavings)}</div>
            <div className="text-[11px] text-white/40 mt-1 font-mono">39.6% net profit margin</div>
          </div>

          <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
              <span>REMAINING BUDGET</span>
              <Receipt className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{formatCurrency(finance.budgetRemaining)}</div>
            <div className="text-[11px] text-white/40 mt-1 font-mono">Runway: 7.4 Months</div>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="p-4 rounded-2xl bg-[#ff3d00]/15 border border-[#ff3d00]/30 flex items-start gap-3.5 backdrop-blur-xl">
          <Sparkles className="w-5 h-5 text-[#ff8a1f] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#ff8a1f] font-bold mb-1">
              AI FINANCE SENTINEL INSIGHT
            </div>
            <p className="text-sm text-amber-100 leading-relaxed font-sans">{finance.aiInsight}</p>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="p-6 rounded-3xl bg-[rgba(56,20,6,0.38)] border border-white/15 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#ff8a1f]" /> Recent Ledger Records
            </h3>
            <span className="text-xs font-mono text-white/50">
              Showing {finance.transactions.length} transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-white/40 border-b border-white/10 uppercase">
                <tr>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Title</th>
                  <th className="py-3 px-2">Scope</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {finance.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-2 text-white/50">{tx.date}</td>
                    <td className="py-3 px-2 text-slate-100 font-medium font-sans">{tx.title}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/70 text-[10px]">
                        {tx.scope}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-white/50">{tx.category}</td>
                    <td
                      className={`py-3 px-2 text-right font-bold ${
                        tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a0701] border border-[#ff8a1f]/50 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white font-mono">Record Transaction</h3>

              <form onSubmit={handleAddSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-white/60 block mb-1">Transaction Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Meta Ads Test, Supplier Fabric"
                    required
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-[#ff8a1f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    required
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-[#ff8a1f] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 block mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-[#2a0b02] border border-white/15 text-white focus:border-[#ff8a1f] focus:outline-none"
                    >
                      <option value="EXPENSE">EXPENSE</option>
                      <option value="INCOME">INCOME</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1">Scope</label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-[#2a0b02] border border-white/15 text-white focus:border-[#ff8a1f] focus:outline-none"
                    >
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="PERSONAL">PERSONAL</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--flame !py-2 !px-5 text-xs font-bold"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
