'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setReady(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15">
              <ShieldCheck className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-indigo-200">MENTRA SECURITY</div>
              <h1 className="mt-1 text-2xl font-semibold">Reset operator password</h1>
            </div>
          </div>

          {success ? (
            <div className="mt-8">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
                Password updated successfully.
              </div>
              <Link
                href="/"
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Return to MENTRA login
              </Link>
            </div>
          ) : !ready ? (
            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Open this page from the latest MENTRA password-reset email. The recovery link creates a temporary secure session.
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="mt-8 space-y-4">
              {errorMsg && (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-xs text-white/50">New password</span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 outline-none focus:border-indigo-400/60"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/50">Confirm password</span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 outline-none focus:border-indigo-400/60"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
