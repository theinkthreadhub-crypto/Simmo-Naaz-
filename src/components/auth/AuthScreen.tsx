'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Bot, Brain, Layers3, Lock, Mail, ShieldCheck, Sparkles, Terminal, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
    </div>
  )
});

const capabilities = [
  {
    icon: Brain,
    label: 'Memory',
    title: 'A second brain that keeps context.',
    copy: 'Decisions, goals, projects and recurring patterns stay connected instead of disappearing into separate apps.'
  },
  {
    icon: Bot,
    label: 'Agents',
    title: 'Specialists that work around one goal.',
    copy: 'Research, finance, Gmail, calendar, learning and business agents can coordinate from a single command.'
  },
  {
    icon: Layers3,
    label: 'Life OS',
    title: 'Your execution layer, not another dashboard.',
    copy: 'Quests, habits, capital, skills and focus become one adaptive operating system built around your progress.'
  }
];

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isSignUp && !displayName.trim()) {
      setErrorMsg('Please specify your operator name.');
      setLoading(false);
      return;
    }

    const result = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);

    if (result.error) setErrorMsg(result.error);
    if (result.message) setSuccessMsg(result.message);
    setLoading(false);
  };

  return (
    <div className="story-shell story-snap min-h-screen bg-[#070a12] text-white">
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#070a12]/70 px-4 py-2.5 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_18px_rgba(91,108,255,0.9)]" />
            <span className="font-display text-sm font-bold tracking-[0.18em]">MENTRA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/demo" className="hidden rounded-full px-4 py-2 text-xs text-white/55 transition hover:text-white sm:inline-flex">
              View demo
            </Link>
            <a href="#access" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-indigo-100">
              Sign in
            </a>
          </div>
        </div>
      </header>

      <section className="story-section overflow-hidden">
        <div className="story-glow left-[-8rem] top-[18%] h-80 w-80 bg-indigo-500/25" />
        <div className="story-glow bottom-[10%] right-[-8rem] h-72 w-72 bg-cyan-300/15" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="story-kicker">Personal intelligence system</div>
            <h1 className="story-title mt-6 max-w-5xl text-[clamp(4.4rem,11vw,10rem)] font-extrabold">
              One mind.
              <span className="story-accent block">One system.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/58 sm:text-lg">
              MENTRA turns goals, memory, money, learning and AI agents into one continuous operating system that moves with you.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#access" className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold shadow-[0_18px_60px_-24px_rgba(91,108,255,0.95)] transition hover:bg-indigo-400">
                Enter MENTRA <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#system" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-5 py-3 text-sm text-white/72 transition hover:bg-white/[0.07]">
                See how it works <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative h-[420px] lg:col-span-5 lg:h-[620px]">
            <div className="absolute inset-10 rounded-full border border-indigo-300/10 bg-indigo-500/[0.035] blur-2xl" />
            <MentraCore3D className="h-full w-full" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-mono tracking-[0.18em] text-cyan-200 backdrop-blur-xl">
              ADAPTIVE CORE // ONLINE
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/28 sm:flex">
          Scroll to explore <ArrowDown className="h-3 w-3" />
        </div>
      </section>

      <section id="system" className="story-section">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              <div className="story-kicker">01 / Connected intelligence</div>
              <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
                Stop switching.
                <span className="story-accent block">Start flowing.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/52 sm:text-base">
                Your context should travel with the work. MENTRA keeps the important thread alive across planning, execution and reflection.
              </p>
            </div>

            <div className="space-y-5 lg:col-span-7">
              {capabilities.map(({ icon: Icon, label, title, copy }, index) => (
                <article key={label} className="story-card min-h-[290px] p-7 sm:p-9">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/15 bg-indigo-500/10">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </div>
                    <span className="story-number text-[5rem]">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="mt-10 max-w-xl">
                    <div className="text-xs uppercase tracking-[0.22em] text-indigo-200/70">{label}</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/52">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section overflow-hidden">
        <div className="story-glow left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/18" />
        <div className="mx-auto w-full max-w-7xl text-center">
          <div className="story-kicker">02 / Command layer</div>
          <h2 className="story-title mx-auto mt-6 max-w-5xl text-5xl font-bold sm:text-7xl lg:text-8xl">
            Tell it the goal.
            <span className="story-accent block">Let the system coordinate.</span>
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-3">
            {['Understand context', 'Route to specialists', 'Return one next move'].map((item, index) => (
              <div key={item} className="story-card p-6 text-left">
                <div className="text-[10px] font-mono tracking-[0.2em] text-cyan-200">0{index + 1}</div>
                <div className="mt-8 text-lg font-semibold">{item}</div>
                <div className="mt-2 text-xs leading-6 text-white/42">
                  One continuous chain instead of disconnected tools and tabs.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="access" className="story-section">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="story-kicker">03 / Your private system</div>
            <h2 className="story-title mt-5 text-5xl font-bold sm:text-7xl">
              Build the version
              <span className="story-accent block">that knows you.</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/52">
              Create an identity to unlock persistent memory, personal progress, private agents and connected workflows.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-white/45">
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
              Supabase-backed authentication and row-level data isolation.
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="story-card mx-auto w-full max-w-md p-6 sm:p-8">
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                    {isSignUp ? 'Create identity' : 'Operator access'}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {isSignUp ? 'Start your MENTRA' : 'Welcome back'}
                  </h3>
                </div>
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </div>

              {errorMsg && (
                <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  {successMsg}
                </div>
              )}

              {googleAuthEnabled && (
                <button
                  onClick={async () => {
                    setErrorMsg(null);
                    const result = await signInWithGoogle();
                    if (result.error) setErrorMsg(result.error);
                  }}
                  className="mt-6 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm transition hover:bg-white/[0.08]"
                >
                  Continue with Google
                </button>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isSignUp && (
                  <label className="block">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-white/38">Operator name</span>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={event => setDisplayName(event.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/24 focus:border-indigo-400/60 focus:bg-white/[0.055]"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-white/38">{isSignUp ? 'Email' : 'Operator ID'}</span>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                    <input
                      type={isSignUp ? 'email' : 'text'}
                      required
                      autoComplete={isSignUp ? 'email' : 'username'}
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder={isSignUp ? 'you@example.com' : 'inkthread'}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/24 focus:border-indigo-400/60 focus:bg-white/[0.055]"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-white/38">Passphrase</span>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/24 focus:border-indigo-400/60 focus:bg-white/[0.055]"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-50"
                >
                  {loading ? 'Connecting…' : isSignUp ? 'Create identity' : 'Enter MENTRA'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-5 text-xs">
                <span className="text-white/38">{isSignUp ? 'Already registered?' : 'First time here?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setPassword('');
                  }}
                  className="text-cyan-200 transition hover:text-white"
                >
                  {isSignUp ? 'Sign in instead' : 'Create identity'}
                </button>
              </div>

              <Link href="/demo" className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/34 transition hover:text-white/70">
                <Terminal className="h-3.5 w-3.5" />
                Open read-only demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
