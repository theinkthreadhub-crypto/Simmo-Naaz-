'use client';

import React, { useState } from 'react';
import { useMentraStore } from '@/lib/store/mentraStore';
import HUDOverlay from '@/components/mentra/HUDOverlay';
import CommandBar from '@/components/mentra/CommandBar';
import SidebarNav from '@/components/navigation/SidebarNav';
import MobileNav from '@/components/navigation/MobileNav';
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-16 lg:pb-0">
      <HUDOverlay />

      <div className="flex flex-1">
        <SidebarNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest font-semibold mb-1">
                <DollarSign className="w-4 h-4" /> MENTRA FINANCIAL TELEMETRY
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Command HUD</h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time cash velocity, unit economics, budget allocations, and automated AI burn rate sentinel.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-mono font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Record Transaction
            </button>
          </div>

          <CommandBar />

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>MONTHLY REVENUE</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-display">{formatCurrency(finance.monthlyIncome)}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">+18.4% vs baseline</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>MONTHLY EXPENSES</span>
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-display">{formatCurrency(finance.monthlyExpenses)}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">68% Ads & Supply Chain</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>NET PROFIT BUFFER</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-display">{formatCurrency(finance.monthlySavings)}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">39.6% net profit margin</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>REMAINING BUDGET</span>
                <Receipt className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-black text-violet-400 font-display">{formatCurrency(finance.budgetRemaining)}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">Runway: 7.4 Months</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold mb-1">
                AI FINANCE SENTINEL INSIGHT
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{finance.aiInsight}</p>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="p-6 rounded-3xl bg-[#0d1017]/90 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" /> Recent Ledger Records
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Showing {finance.transactions.length} transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-400 border-b border-white/10 uppercase">
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
                      <td className="py-3 px-2 text-slate-400">{tx.date}</td>
                      <td className="py-3 px-2 text-slate-100 font-medium font-sans">{tx.title}</td>
                      <td className="py-3 px-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 text-[10px]">
                          {tx.scope}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{tx.category}</td>
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

          {/* Record Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0d1017] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white font-mono">Record Transaction</h3>

                <form onSubmit={handleAddSubmit} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Transaction Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Meta Ads Test, Supplier Fabric"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="EXPENSE">EXPENSE</option>
                        <option value="INCOME">INCOME</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Scope</label>
                      <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
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
                      className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 transition"
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

      <MobileNav />
    </div>
  );
}
