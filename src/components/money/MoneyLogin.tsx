'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

// The app has a single operator account; its ID is fixed so only the password is asked.
const OPERATOR_ID = 'inkthread';

export default function MoneyLogin() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    const res = await signIn(OPERATOR_ID, password);
    if (res?.error) {
      setError(res.error.toLowerCase().includes('invalid') ? 'Wrong password. Try again.' : res.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b1220] px-6 text-white">
      <form onSubmit={submit} className="w-full max-w-xs text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-3xl font-bold text-[#0b1220]">
          ₹
        </div>
        <h1 className="mt-4 text-xl font-semibold">Money Tracker</h1>
        <p className="mt-1 text-sm text-white/55">Enter your password to continue</p>

        <div className="mt-6 flex items-center rounded-2xl bg-white/5 px-3 ring-1 ring-white/10 focus-within:ring-amber-300/60">
          <Lock className="h-4 w-4 text-white/40" />
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
            className="w-full bg-transparent px-3 py-3.5 outline-none placeholder:text-white/30"
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="p-1 text-white/50"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 font-semibold text-black disabled:opacity-40"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Opening…' : 'Open'}
        </button>
        <p className="mt-4 text-xs text-white/40">You stay logged in on this phone.</p>
      </form>
    </div>
  );
}
