'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, PieChart, Sparkles, Trash2, X } from 'lucide-react';
import MoneyPie, { PieSlice } from '@/components/money/MoneyPie';
import { MONEY_CATEGORIES, MoneyType, getMoneyCategory } from '@/lib/money/categories';

interface Entry {
  id: string;
  amount: number;
  type: MoneyType;
  category: string;
  description: string;
  date: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const EXAMPLES = ['250 breakfast', '500 petrol', 'lent 2000 to Ramesh', 'salary 30000 received', '1200 electricity bill'];

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dayLabel(iso: string) {
  const today = localDate();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === today) return 'Today';
  if (iso === localDate(y)) return 'Yesterday';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

export default function MoneyPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ entry: Entry; by: string } | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<MoneyType>('EXPENSE');
  const [editing, setEditing] = useState<Entry | null>(null);

  const isCurrentMonth = monthKey(month) === monthKey(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/money?month=${monthKey(month)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load entries');
      setEntries(json.entries);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const totals = useMemo(() => {
    let spent = 0;
    let earned = 0;
    for (const e of entries) {
      if (e.type === 'EXPENSE') spent += e.amount;
      else earned += e.amount;
    }
    return { spent, earned, left: earned - spent };
  }, [entries]);

  const slices: PieSlice[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (e.type !== chartType) continue;
      const key = getMoneyCategory(e.category, e.type).key;
      map.set(key, (map.get(key) || 0) + e.amount);
    }
    return Array.from(map.entries()).map(([key, value]) => {
      const c = getMoneyCategory(key, chartType);
      return { key, label: c.label, emoji: c.emoji, value };
    });
  }, [entries, chartType]);

  const grouped = useMemo(() => {
    const out: Array<[string, Entry[]]> = [];
    for (const e of entries) {
      const last = out[out.length - 1];
      if (last && last[0] === e.date) last[1].push(e);
      else out.push([e.date, [e]]);
    }
    return out;
  }, [entries]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = note.trim() || amount.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: note.trim() ? note.trim() : amount.trim(),
          amount: amount.trim() ? Number(amount) : undefined,
          date: localDate(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save');
      setAmount('');
      setNote('');
      setToast({ entry: json.entry, by: json.parsedBy });
      if (isCurrentMonth) setEntries((prev) => [json.entry, ...prev]);
      else setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeCategory(entry: Entry, key: string) {
    const cat = getMoneyCategory(key);
    const res = await fetch(`/api/money/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: key }),
    });
    if (!res.ok) {
      setError('Could not change category');
      return;
    }
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, category: cat.key, type: cat.type } : e)));
    setEditing(null);
    setToast(null);
  }

  async function remove(entry: Entry) {
    if (!confirm(`Delete "${entry.description}" (${inr(entry.amount)})?`)) return;
    const res = await fetch(`/api/money/${entry.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete');
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setEditing(null);
  }

  const shiftMonth = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="min-h-[100dvh] bg-[#0b1220] text-white">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <Link href="/hq" className="rounded-full p-2 text-white/60 hover:bg-white/10" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftMonth(-1)} className="rounded-full p-2 hover:bg-white/10" aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[120px] text-center text-sm font-semibold">
              {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              className="rounded-full p-2 hover:bg-white/10 disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowChart(true)}
            className="rounded-full p-2 text-white/80 hover:bg-white/10"
            aria-label="Show pie chart"
          >
            <PieChart className="h-5 w-5" />
          </button>
        </header>

        {/* Totals */}
        <section className="mt-2 rounded-3xl bg-gradient-to-br from-[#16233d] to-[#0f1a2e] p-5 shadow-lg ring-1 ring-white/10">
          <div className="text-xs uppercase tracking-wider text-white/55">Total spent</div>
          <div className="mt-1 text-4xl font-bold tabular-nums">{inr(totals.spent)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/5 px-3 py-2">
              <div className="text-xs text-white/55">Income</div>
              <div className="font-semibold tabular-nums text-emerald-300">{inr(totals.earned)}</div>
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-2">
              <div className="text-xs text-white/55">Balance</div>
              <div className={`font-semibold tabular-nums ${totals.left < 0 ? 'text-rose-300' : 'text-white'}`}>
                {totals.left < 0 ? '−' : ''}
                {inr(Math.abs(totals.left))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowChart(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-2.5 text-sm font-medium hover:bg-white/15"
          >
            <PieChart className="h-4 w-4" /> Show pie chart
          </button>
        </section>

        {/* Add entry */}
        <form onSubmit={submit} className="mt-5 rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/60">
            <Sparkles className="h-4 w-4 text-amber-300" /> Enter amount and what it was for. AI picks the category
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex w-32 items-center rounded-2xl bg-black/30 px-3 ring-1 ring-white/10 focus-within:ring-amber-300/60">
              <span className="text-white/50">₹</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="500"
                className="w-full bg-transparent px-1 py-3 text-lg font-semibold outline-none placeholder:text-white/25"
                aria-label="Amount"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What for? (petrol, tea…)"
              className="min-w-0 flex-1 rounded-2xl bg-black/30 px-3 py-3 outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-amber-300/60"
              aria-label="What for"
              maxLength={300}
            />
          </div>
          <button
            type="submit"
            disabled={saving || (!amount.trim() && !note.trim())}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'AI is categorising…' : 'Add'}
          </button>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setAmount('');
                  setNote(ex);
                }}
                className="shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-white/65 ring-1 ring-white/10 hover:bg-white/10"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="mt-3 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">{error}</div>
        )}

        {/* Entries */}
        <section className="mt-6">
          {loading ? (
            <div className="flex justify-center py-10 text-white/50">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">No entries yet. Add an amount above to start.</p>
          ) : (
            grouped.map(([date, list]) => (
              <div key={date} className="mb-4">
                <div className="mb-1.5 flex justify-between px-1 text-xs text-white/45">
                  <span>{dayLabel(date)}</span>
                  <span className="tabular-nums">
                    {inr(list.filter((e) => e.type === 'EXPENSE').reduce((a, e) => a + e.amount, 0))}
                  </span>
                </div>
                <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                  {list.map((e) => {
                    const cat = getMoneyCategory(e.category, e.type);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => setEditing(e)}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-white/5"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                            {cat.emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{e.description}</span>
                            <span className="block text-xs text-white/45">{cat.label}</span>
                          </span>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              e.type === 'INCOME' ? 'text-emerald-300' : 'text-white'
                            }`}
                          >
                            {e.type === 'INCOME' ? '+' : '−'}
                            {inr(e.amount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Saved toast */}
      {toast && (
        <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#1d2b47] px-4 py-3 text-sm shadow-2xl ring-1 ring-white/15">
          <span className="text-lg">{getMoneyCategory(toast.entry.category, toast.entry.type).emoji}</span>
          <span className="flex-1">
            {inr(toast.entry.amount)} →{' '}
            <b>{getMoneyCategory(toast.entry.category, toast.entry.type).label}</b>
            <span className="block text-xs text-white/50">{toast.by === 'ai' ? 'Category picked by AI' : 'Auto category'}</span>
          </span>
          <button onClick={() => setEditing(toast.entry)} className="rounded-full bg-white/10 px-3 py-1 text-xs">
            Change
          </button>
        </div>
      )}

      {/* Chart sheet */}
      {showChart && (
        <Sheet onClose={() => setShowChart(false)} title="Where the money went">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1 text-sm">
            {(['EXPENSE', 'INCOME'] as MoneyType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`rounded-xl py-2 font-medium ${chartType === t ? 'bg-white/15 text-white' : 'text-white/55'}`}
              >
                {t === 'EXPENSE' ? 'Spent' : 'Income'}
              </button>
            ))}
          </div>
          <MoneyPie
            slices={slices}
            title={`${chartType === 'EXPENSE' ? 'Spent' : 'Income'} · ${month.toLocaleDateString('en-IN', { month: 'short' })}`}
          />
        </Sheet>
      )}

      {/* Edit sheet */}
      {editing && (
        <Sheet onClose={() => setEditing(null)} title={`${editing.description} · ${inr(editing.amount)}`}>
          <p className="mb-3 text-xs text-white/55">Wrong category? Pick the right one:</p>
          <div className="grid grid-cols-2 gap-2">
            {MONEY_CATEGORIES.map((c) => {
              const current = getMoneyCategory(editing.category, editing.type).key === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => changeCategory(editing, c.key)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs ring-1 ${
                    current ? 'bg-amber-400/15 ring-amber-300/60' : 'bg-white/5 ring-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="flex-1">{c.label}</span>
                  {c.type === 'INCOME' && <span className="text-[10px] text-emerald-300">+in</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => remove(editing)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/15 py-3 text-sm font-medium text-rose-200 ring-1 ring-rose-400/30"
          >
            <Trash2 className="h-4 w-4" /> Delete entry
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#0f1a2e] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-white/10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
