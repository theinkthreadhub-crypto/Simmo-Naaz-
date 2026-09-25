'use client';

import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, User, Terminal } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, setDemoUser, isDemoAllowed } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isSignUp) {
      if (!displayName.trim()) {
        setErrorMsg('Tell MENTRA what to call you.');
        setLoading(false);
        return;
      }
      const res = await signUp(email, password, displayName);
      if (res.error) setErrorMsg(res.error);
    } else {
      const res = await signIn(email, password);
      if (res.error) setErrorMsg(res.error);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#090B0F] px-4 py-8 sm:px-6 lg:px-10 flex items-center">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="py-6 lg:py-12">
          <div className="inline-flex items-center rounded-full border border-[#292F3B] bg-[#161A22] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#A1A8B5]">
            [ YOUR PERSONAL OS ]
          </div>

          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-8xl uppercase leading-[0.92]">
            Your life.<br />
            <span className="text-[#B7FF3C]">One system.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#A1A8B5]">
            Goals, tasks, money, learning, memory and AI agents — connected around what matters to you.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {['Private by design', 'Permission-based AI', 'You stay in control'].map((item) => (
              <div key={item} className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
                <ShieldCheck className="h-4 w-4 text-[#B7FF3C]" />
                <div className="mt-3 text-xs font-medium text-[#F5F7FA]">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-7 lg:p-8">
          <div className="border-b border-[#292F3B] pb-5">
            <div className="mentra-label">{isSignUp ? 'Create account' : 'Welcome back'}</div>
            <h2 className="mt-2 text-2xl sm:text-3xl uppercase">
              {isSignUp ? 'Start your system' : 'Enter MENTRA'}
            </h2>
            <p className="mt-2 text-sm text-[#A1A8B5]">
              {isSignUp ? 'Set up your account, then personalize it.' : 'Continue where you left off.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mt-5 rounded-xl border border-[#FF5C5C]/30 bg-[#FF5C5C]/10 p-3 text-sm text-[#FF8A8A]">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => signInWithGoogle()}
            className="mt-6 min-h-12 w-full rounded-xl border border-[#292F3B] bg-[#10131A] px-4 text-sm font-semibold text-[#F5F7FA] hover:border-[#3A424F] flex items-center justify-center gap-3"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12.8s.6 4.5 1.6 6.4l3.7-4.5z"/>
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 18.5C3.5 22.4 7.4 24 12 24z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#292F3B]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">or</span>
            <div className="h-px flex-1 bg-[#292F3B]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Field label="Name" icon={<User className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should MENTRA call you?"
                  className="min-h-12 w-full bg-transparent pl-10 pr-4 text-sm focus:outline-none"
                />
              </Field>
            )}

            <Field label="Email" icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-h-12 w-full bg-transparent pl-10 pr-4 text-sm focus:outline-none"
              />
            </Field>

            <Field label="Password" icon={<Lock className="h-4 w-4" />}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="min-h-12 w-full bg-transparent pl-10 pr-4 text-sm focus:outline-none"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="mentra-primary-button mt-2 w-full px-5 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 border-t border-[#292F3B] pt-5 flex items-center justify-between gap-4 text-sm">
            <span className="text-[#697181]">{isSignUp ? 'Already have an account?' : 'New to MENTRA?'}</span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="min-h-11 text-[#B7FF3C] font-semibold"
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </div>

          {isDemoAllowed && (
            <button
              type="button"
              onClick={() => setDemoUser('Operator Naaz')}
              className="mt-2 min-h-11 w-full text-xs text-[#697181] hover:text-[#A1A8B5] flex items-center justify-center gap-2"
            >
              <Terminal className="h-3.5 w-3.5" />
              Open demo workspace
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">{label}</span>
      <span className="relative block rounded-xl border border-[#292F3B] bg-[#10131A] focus-within:border-[#B7FF3C]/50">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#697181]">{icon}</span>
        {children}
      </span>
    </label>
  );
}
