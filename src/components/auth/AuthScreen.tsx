'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  Command,
  Lock,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const story = [
  {
    id: 'fragmented',
    index: '01',
    eyebrow: 'THE PROBLEM',
    title: 'YOUR LIFE IS\nEVERYWHERE.',
    copy: 'Tasks in one app. Goals in another. Money, learning, calendar, notes and decisions scattered across your day.',
  },
  {
    id: 'understand',
    index: '02',
    eyebrow: 'UNDERSTAND',
    title: 'MENTRA SEES\nTHE CONTEXT.',
    copy: 'It brings your priorities, routines, calendar, tasks, goals and memory into one working picture.',
  },
  {
    id: 'plan',
    index: '03',
    eyebrow: 'PLAN',
    title: 'KNOW WHAT\nMATTERS NOW.',
    copy: 'MENTRA turns context into a clear next move — what to do now, what can wait, and what needs your attention.',
  },
  {
    id: 'act',
    index: '04',
    eyebrow: 'ACT',
    title: 'AI THAT CAN\nDO THE WORK.',
    copy: 'Permission-based agents can research, draft, organize and prepare actions. Sensitive actions still wait for your approval.',
  },
  {
    id: 'learn',
    index: '05',
    eyebrow: 'LEARN',
    title: 'THE SYSTEM\nGETS BETTER.',
    copy: 'Progress, decisions and patterns become useful memory, so MENTRA can stay aligned with how you actually work.',
  },
];

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, setDemoUser, isDemoAllowed } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('fragmented');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const root = document.documentElement;
      const distance = root.scrollHeight - window.innerHeight;
      setProgress(distance > 0 ? Math.min(100, Math.max(0, (window.scrollY / distance) * 100)) : 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { threshold: [0.35, 0.55, 0.7] }
    );

    story.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const activeIndex = useMemo(
    () => Math.max(0, story.findIndex((item) => item.id === activeSection)),
    [activeSection]
  );

  const scrollToAccess = () => {
    document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <main className="relative min-h-screen overflow-x-hidden bg-[#07090D] text-[#F5F7FA]">
      <div
        className="fixed left-0 top-0 z-[80] h-[2px] bg-[#B7FF3C] transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#07090D]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex min-h-11 items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B7FF3C] font-display text-xs text-[#090B0F]">
              M
            </span>
            <span className="font-display text-sm tracking-tight">MENTRA</span>
          </button>

          <div className="hidden items-center gap-5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181] md:flex">
            <span>Personal OS</span>
            <span className="h-1 w-1 rounded-full bg-[#343A46]" />
            <span>AI + Memory + Action</span>
          </div>

          <button
            onClick={scrollToAccess}
            className="min-h-10 rounded-xl border border-[#292F3B] bg-[#10131A] px-4 text-xs font-semibold text-[#F5F7FA] transition-colors hover:border-[#B7FF3C]/40"
          >
            Enter MENTRA
          </button>
        </div>
      </header>

      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-12 pt-24 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 mentra-grid opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-[45%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B7FF3C]/[0.055] blur-[110px] sm:h-[600px] sm:w-[600px]" />

        <div className="relative mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#B7FF3C]/25 bg-[#B7FF3C]/[0.06] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#B7FF3C]">
                [ YOUR PERSONAL OPERATING SYSTEM ]
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">
                Built around you
              </span>
            </div>

            <h1 className="max-w-5xl text-[clamp(3.6rem,10vw,9.5rem)] leading-[0.82] tracking-[-0.055em]">
              STOP
              <br />
              MANAGING
              <br />
              <span className="text-[#B7FF3C]">YOUR LIFE.</span>
            </h1>

            <div className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-xl text-base leading-relaxed text-[#A1A8B5] sm:text-lg">
                Build one intelligent system that understands your goals, organizes your day, remembers context and helps move work forward.
              </p>
              <button
                onClick={() => document.getElementById('fragmented')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex min-h-14 items-center gap-3 rounded-full border border-[#292F3B] bg-[#10131A] px-5 text-xs font-mono uppercase tracking-[0.12em] text-[#F5F7FA]"
              >
                Scroll the story
                <ArrowDown className="h-4 w-4 text-[#B7FF3C] transition-transform group-hover:translate-y-1" />
              </button>
            </div>
          </div>

          <HeroSystem />
        </div>
      </section>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:gap-14">
          <div>
            {story.map((item, index) => (
              <section
                key={item.id}
                id={item.id}
                className="scroll-mt-16 flex min-h-[92svh] items-center border-t border-white/[0.06] py-20 lg:min-h-[100svh]"
              >
                <div className="w-full max-w-3xl">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#B7FF3C]">{item.index}</span>
                    <span className="h-px w-10 bg-[#343A46]" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#697181]">{item.eyebrow}</span>
                  </div>

                  <h2 className="whitespace-pre-line text-[clamp(3rem,7vw,7rem)] leading-[0.86] tracking-[-0.05em]">
                    {item.title}
                  </h2>

                  <p className="mt-7 max-w-xl text-base leading-relaxed text-[#A1A8B5] sm:text-lg">
                    {item.copy}
                  </p>

                  <div className="mt-9 lg:hidden">
                    <StoryVisual step={index} />
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center">
              <div className="w-full">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#697181]">
                    MENTRA / LIVE SYSTEM
                  </span>
                  <span className="font-mono text-[10px] text-[#B7FF3C]">
                    {String(activeIndex + 1).padStart(2, '0')} / 05
                  </span>
                </div>
                <StoryVisual step={activeIndex} />
                <div className="mt-4 flex gap-1.5">
                  {story.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                      aria-label={`Go to ${item.eyebrow}`}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        index <= activeIndex ? 'bg-[#B7FF3C]' : 'bg-[#292F3B]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="border-y border-white/[0.06] bg-[#0A0D12] py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mentra-label">One loop</div>
          <h2 className="mt-3 max-w-6xl text-[clamp(3rem,8vw,8rem)] leading-[0.86] tracking-[-0.05em]">
            UNDERSTAND.
            <br />
            PLAN. ACT.
            <br />
            <span className="text-[#B7FF3C]">LEARN. REPEAT.</span>
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-[#292F3B] bg-[#292F3B] sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['01', 'Understand', 'Context becomes visible.'],
              ['02', 'Plan', 'Priorities become clear.'],
              ['03', 'Act', 'Work moves forward.'],
              ['04', 'Track', 'Progress stays factual.'],
              ['05', 'Learn', 'Memory improves context.'],
            ].map(([num, title, copy]) => (
              <div key={num} className="bg-[#10131A] p-5 sm:p-6">
                <div className="font-mono text-[10px] text-[#697181]">{num}</div>
                <div className="mt-8 text-lg font-semibold uppercase">{title}</div>
                <div className="mt-2 text-sm text-[#A1A8B5]">{copy}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="access" className="scroll-mt-16 px-4 py-24 sm:px-6 sm:py-32 lg:px-10">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <span className="rounded-full border border-[#B7FF3C]/25 bg-[#B7FF3C]/[0.06] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#B7FF3C]">
              [ START HERE ]
            </span>
            <h2 className="mt-6 text-[clamp(3rem,6vw,6.5rem)] leading-[0.88] tracking-[-0.045em]">
              YOUR LIFE.
              <br />
              <span className="text-[#B7FF3C]">ONE SYSTEM.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#A1A8B5]">
              Sign in to continue your system, or open the preview workspace to explore the experience.
            </p>
          </div>

          <section className="rounded-[24px] border border-[#292F3B] bg-[#10131A] p-5 sm:p-8 lg:p-10">
            <div className="border-b border-[#292F3B] pb-6">
              <div className="mentra-label">{isSignUp ? 'Create account' : 'Welcome back'}</div>
              <h3 className="mt-2 text-2xl sm:text-3xl uppercase">
                {isSignUp ? 'Start your system' : 'Enter MENTRA'}
              </h3>
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
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#292F3B] bg-[#161A22] px-4 text-sm font-semibold text-[#F5F7FA] transition-colors hover:border-[#3A424F]"
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
                className="mentra-primary-button mt-2 flex w-full items-center justify-center gap-2 px-5 text-sm disabled:opacity-50"
              >
                {loading ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#292F3B] pt-5 text-sm">
              <span className="text-[#697181]">{isSignUp ? 'Already have an account?' : 'New to MENTRA?'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                }}
                className="min-h-11 font-semibold text-[#B7FF3C]"
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </div>

            {isDemoAllowed && (
              <button
                type="button"
                onClick={() => setDemoUser('Operator Naaz')}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 text-xs text-[#697181] transition-colors hover:text-[#B7FF3C]"
              >
                <Terminal className="h-3.5 w-3.5" />
                Open demo workspace
              </button>
            )}
          </section>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 text-xs text-[#697181] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-[#F5F7FA]">MENTRA</span>
          <span className="font-mono uppercase tracking-[0.12em]">Your life. One system.</span>
        </div>
      </footer>
    </main>
  );
}

function HeroSystem() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:mx-0 lg:ml-auto">
      <div className="absolute -inset-10 rounded-full bg-[#B7FF3C]/[0.045] blur-[70px]" />
      <div className="relative rounded-[28px] border border-[#292F3B] bg-[#0D1016]/95 p-4 shadow-2xl shadow-black/30 sm:p-5">
        <div className="flex items-center justify-between border-b border-[#292F3B] pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4DDB8A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#697181]">System active</span>
          </div>
          <Command className="h-4 w-4 text-[#697181]" />
        </div>

        <div className="mt-4 rounded-2xl border border-[#B7FF3C]/20 bg-[#B7FF3C]/[0.05] p-4">
          <div className="mentra-label">Now</div>
          <div className="mt-2 text-lg font-semibold">Launch campaign brief</div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-lg bg-[#B7FF3C] px-2.5 py-1 text-[10px] font-semibold text-[#090B0F]">P1</span>
            <span className="rounded-lg border border-[#292F3B] px-2.5 py-1 text-[10px] text-[#A1A8B5]">45 min</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <MiniMetric icon={<Target className="h-4 w-4" />} label="Goals" value="3 active" />
          <MiniMetric icon={<Wallet className="h-4 w-4" />} label="Money" value="On track" />
          <MiniMetric icon={<Brain className="h-4 w-4" />} label="Memory" value="Synced" />
          <MiniMetric icon={<Bot className="h-4 w-4" />} label="Agents" value="2 ready" />
        </div>

        <div className="mt-3 rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
          <div className="flex items-center gap-2 text-[#7C8CFF]">
            <Sparkles className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">MENTRA noticed</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A8B5]">
            Your highest-priority task has a clear 45-minute window before the next calendar event.
          </p>
        </div>
      </div>
    </div>
  );
}

function StoryVisual({ step }: { step: number }) {
  const panels = [
    <FragmentedVisual key="fragmented" />,
    <ContextVisual key="context" />,
    <PlanVisual key="plan" />,
    <AgentVisual key="agent" />,
    <LearningVisual key="learning" />,
  ];

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[26px] border border-[#292F3B] bg-[#0D1016] p-4 sm:min-h-[500px] sm:p-6">
      <div className="pointer-events-none absolute inset-0 mentra-grid opacity-25" />
      <div className="relative h-full transition-all duration-500">{panels[step] || panels[0]}</div>
    </div>
  );
}

function FragmentedVisual() {
  return (
    <div className="relative flex min-h-[380px] h-full items-center justify-center sm:min-h-[450px]">
      {[
        ['Tasks', 'top-[9%] left-[4%]', Target],
        ['Money', 'top-[17%] right-[4%]', Wallet],
        ['Calendar', 'bottom-[18%] left-[2%]', CalendarDays],
        ['Notes', 'bottom-[9%] right-[9%]', Brain],
        ['Apps', 'top-[46%] right-[12%]', Network],
      ].map(([label, position, Icon]: any) => (
        <div key={label} className={`absolute ${position} rounded-2xl border border-[#292F3B] bg-[#161A22] p-3 sm:p-4`}>
          <Icon className="h-4 w-4 text-[#697181]" />
          <div className="mt-2 text-xs text-[#A1A8B5]">{label}</div>
        </div>
      ))}
      <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-[#FF5C5C]/20 bg-[#FF5C5C]/[0.05] text-center">
        <div>
          <div className="font-display text-xl">YOU</div>
          <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.12em] text-[#697181]">context switching</div>
        </div>
      </div>
    </div>
  );
}

function ContextVisual() {
  return (
    <div className="flex min-h-[380px] h-full flex-col justify-center sm:min-h-[450px]">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#B7FF3C]/30 bg-[#B7FF3C]/[0.07]">
        <Brain className="h-9 w-9 text-[#B7FF3C]" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {['Goals', 'Tasks', 'Calendar', 'Money', 'Learning', 'Memory'].map((item) => (
          <div key={item} className="rounded-xl border border-[#292F3B] bg-[#10131A] px-3 py-3 text-center text-xs text-[#A1A8B5]">
            {item}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-5 rounded-full border border-[#4DDB8A]/25 bg-[#4DDB8A]/[0.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4DDB8A]">
        context connected
      </div>
    </div>
  );
}

function PlanVisual() {
  return (
    <div className="flex min-h-[380px] h-full flex-col justify-center gap-3 sm:min-h-[450px]">
      <PlanRow label="NOW" title="Finish campaign brief" meta="45 min · P1" active />
      <PlanRow label="NEXT" title="Review supplier response" meta="20 min · P2" />
      <PlanRow label="LATER" title="Learning practice" meta="15 min · system" />
      <div className="mt-3 rounded-2xl border border-[#292F3B] bg-[#10131A] p-4 text-sm text-[#A1A8B5]">
        <span className="text-[#7C8CFF]">MENTRA:</span> Your schedule has enough room for the priority task before 4 PM.
      </div>
    </div>
  );
}

function AgentVisual() {
  return (
    <div className="flex min-h-[380px] h-full flex-col justify-center gap-3 sm:min-h-[450px]">
      <AgentRow title="Research Agent" state="WORKING" copy="Comparing current options and sources." />
      <AgentRow title="Email Assistant" state="WAITING FOR APPROVAL" copy="Draft ready. Nothing has been sent." warning />
      <AgentRow title="Weekly Review" state="READY" copy="Can summarize completed work and open loops." />
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#B7FF3C]/20 bg-[#B7FF3C]/[0.05] p-3 text-xs text-[#A1A8B5]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#B7FF3C]" />
        Sensitive actions require approval.
      </div>
    </div>
  );
}

function LearningVisual() {
  return (
    <div className="flex min-h-[380px] h-full flex-col justify-center sm:min-h-[450px]">
      <div className="mentra-label">Your system</div>
      <div className="mt-3 text-3xl font-display">LEVEL 07</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#090B0F]">
        <div className="h-full w-[68%] rounded-full bg-[#B7FF3C]" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <MiniMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value="Real actions" />
        <MiniMetric icon={<Zap className="h-4 w-4" />} label="XP" value="Earned only" />
        <MiniMetric icon={<Brain className="h-4 w-4" />} label="Memory" value="Editable" />
        <MiniMetric icon={<ShieldCheck className="h-4 w-4" />} label="Control" value="Yours" />
      </div>
      <div className="mt-5 text-sm leading-relaxed text-[#A1A8B5]">
        Progress comes from completed actions — not fake scores, hidden rankings or invented activity.
      </div>
    </div>
  );
}

function PlanRow({ label, title, meta, active }: { label: string; title: string; meta: string; active?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? 'border-[#B7FF3C]/30 bg-[#B7FF3C]/[0.06]' : 'border-[#292F3B] bg-[#10131A]'}`}>
      <div className={`font-mono text-[9px] uppercase tracking-[0.12em] ${active ? 'text-[#B7FF3C]' : 'text-[#697181]'}`}>{label}</div>
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-[#697181]">{meta}</div>
    </div>
  );
}

function AgentRow({ title, state, copy, warning }: { title: string; state: string; copy: string; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4 text-[#B7FF3C]" />
          {title}
        </div>
        <span className={`rounded-full px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] ${warning ? 'bg-[#FFB020]/10 text-[#FFB020]' : 'bg-[#4DDB8A]/10 text-[#4DDB8A]'}`}>
          {state}
        </span>
      </div>
      <div className="mt-2 text-xs text-[#697181]">{copy}</div>
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#292F3B] bg-[#10131A] p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[#B7FF3C]">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#697181]">{label}</span>
      </div>
      <div className="mt-2 text-xs font-semibold sm:text-sm">{value}</div>
    </div>
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
      <span className="relative block rounded-xl border border-[#292F3B] bg-[#161A22] focus-within:border-[#B7FF3C]/50">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#697181]">{icon}</span>
        {children}
      </span>
    </label>
  );
}
