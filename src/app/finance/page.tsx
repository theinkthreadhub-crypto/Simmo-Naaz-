'use client';

import React, { useState } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';
import { FinanceTransaction } from '@/types/mentra';

export default function FinancePage() {
  const { user } = useAuth();
  const { finance, syncUserDatabase } = useMentraStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FinanceTransaction['category']>('OTHER');
  const [scope, setScope] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    if (!user?.id || !Number.isFinite(numeric) || numeric <= 0 || !description.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: type === 'EXPENSE' ? -Math.abs(numeric) : Math.abs(numeric),
          description: description.trim(),
          category,
          businessPersonal: scope
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Transaction was not saved.');

      await syncUserDatabase(user.id);
      setAmount('');
      setDescription('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction was not saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono tracking-widest text-mentra-amber">VERIFIED LEDGER</div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-1">Finance</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-mentra-orange text-white text-xs font-semibold">
          <Plus className="w-4 h-4" /> RECORD TRANSACTION
        </button>
      </div>

      {error && <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric title="Income" value={finance.monthlyIncome} icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
        <Metric title="Expenses" value={finance.monthlyExpenses} icon={<TrendingDown className="w-5 h-5 text-rose-400" />} />
        <Metric title="Net Cash Flow" value={finance.monthlySavings} icon={<DollarSign className="w-5 h-5 text-mentra-amber" />} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/50 overflow-hidden">
        <div className="p-5 border-b border-white/10 text-sm font-semibold text-white">Transactions</div>
        {finance.transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/45">No verified finance transactions yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {finance.transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{tx.title}</div>
                  <div className="text-[11px] text-white/40">{tx.date} • {tx.category} • {tx.scope}</div>
                </div>
                <div className={`font-mono text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-300'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/15 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Record real transaction</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-white/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['EXPENSE','INCOME'] as const).map(item => (
                <button key={item} type="button" onClick={() => setType(item)} className={`py-2 rounded-xl text-xs font-bold ${type === item ? 'bg-mentra-orange text-white' : 'bg-white/5 text-white/60'}`}>{item}</button>
              ))}
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0.01" step="0.01" required placeholder="Amount" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            <input value={description} onChange={e => setDescription(e.target.value)} required placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            <div className="grid grid-cols-2 gap-3">
              <select value={category} onChange={e => setCategory(e.target.value as FinanceTransaction['category'])} className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs">
                {['BUSINESS_ADS','INVENTORY','LOGISTICS','SOFTWARE','LIVING','INVESTMENT','OTHER'].map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={scope} onChange={e => setScope(e.target.value as 'BUSINESS' | 'PERSONAL')} className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs">
                <option>BUSINESS</option><option>PERSONAL</option>
              </select>
            </div>
            <button disabled={saving} className="w-full py-3 rounded-xl bg-mentra-orange text-white font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save transaction'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <div className="p-5 rounded-2xl border border-white/10 bg-black/50"><div className="flex items-center justify-between">{icon}<span className="text-[10px] text-white/40 uppercase">{title}</span></div><div className="mt-4 text-2xl font-mono font-bold text-white">₹{value.toLocaleString()}</div></div>;
}
