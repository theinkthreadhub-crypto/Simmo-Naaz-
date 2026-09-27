'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Bot, Brain, CircleDollarSign, Command, Focus, Layers3, Target, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CommandBar from '@/components/mentra/CommandBar';
import SystemStatus from '@/components/mentra/SystemStatus';
import QuestCard from '@/components/quests/QuestCard';
import AgentStatusCard from '@/components/agents/AgentStatusCard';
import MemoryCard from '@/components/mentra/MemoryCard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-52 w-52 rounded-full bg-[#d8ff63]/10 blur-3xl animate-pulse" />
    </div>
  )
});

const lifeSystems = [
  {
    name: 'Goals',
    href: '/goals',
    descriptor: 'Direction layer',
    copy: 'Turn long-range ambition into a living roadmap with next actions that stay visible.',
    icon: Target
  },
  {
    name: 'Focus',
    href: '/focus',
    descriptor: 'Attention layer',
    copy: 'Protect the current move, reduce context switching, and keep the day pointed at what matters.',
    icon: Focus
  },
  {
    name: 'Finance',
    href: '/finance',
    descriptor: 'Capital layer',
    copy: 'Track cash flow, savings and decisions without separating money from the goals it supports.',
    icon: CircleDollarSign
  },
  {
    name: 'Memory',
    href: '/memory',
    descriptor: 'Context layer',
    copy: 'Keep decisions, patterns and useful context connected so MENTRA can build on your past.',
    icon: Brain
  },
  {
    name: 'Agents',
    href: '/agents',
    descriptor: 'Execution layer',
    copy: 'Route narrow jobs to permission-aware agents while you stay in control of sensitive actions.',
    icon: Bot
  },
  {
    name: 'Projects',
    href: '/projects',
    descriptor: 'Momentum layer',
    copy: 'Keep plans, decisions and progress in the same operating thread from idea to completion.',
    icon: Layers3
  }
];

const storyWords = 'You decide the direction. MENTRA keeps the context, routes the work, watches the moving parts and makes the next useful action easier to see.'.split(' ');

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, profile, progress } = useAuth();
  const { quests, goals, finance, agents, memories, player } = useMentraStore();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.18 });

  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator';

  const activeQuests = quests.filter(quest => quest.status === 'ACTIVE');
  const completedQuests = quests.filter(quest => quest.status === 'COMPLETED').length;
  const workingAgents = agents.filter(agent => ['WORKING', 'READY', 'MONITORING'].includes(agent.status));

  useEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.neo-hero-line-inner', {
          yPercent: 115,
          duration: 1.15,
          stagger: 0.12,
          ease: 'power4.out'
        });

        gsap.from('.neo-hero-meta', {
          y: 24,
          opacity: 0,
          duration: 0.9,
          delay: 0.45,
          stagger: 0.08,
          ease: 'power3.out'
        });

        gsap.to('.neo-core-wrap', {
          yPercent: 14,
          rotation: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: '.neo-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2
          }
        });

        gsap.utils.toArray<HTMLElement>('.neo-reveal').forEach((element) => {
          gsap.from(element, {
            y: 70,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 86%',
              toggleActions: 'play none none reverse'
            }
          });
        });

        gsap.fromTo(
          '.neo-word',
          { opacity: 0.12 },
          {
            opacity: 1,
            stagger: 0.035,
            ease: 'none',
            scrollTrigger: {
              trigger: '.neo-manifesto',
              start: 'top 72%',
              end: 'bottom 38%',
              scrub: 1
            }
          }
        );

        gsap.utils.toArray<HTMLElement>('.neo-stack-card').forEach((card, index) => {
          gsap.to(card, {
            scale: 0.97 - index * 0.008,
            opacity: 0.8,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top 18%',
              end: 'bottom top',
              scrub: true
            }
          });
        });
      });

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const track = document.querySelector<HTMLElement>('.neo-systems-track');
        if (!track) return;

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 128);

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.neo-systems-pin',
            start: 'top top',
            end: () => '+=' + Math.max(1400, distance() * 1.45),
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });
      });
    }, rootRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="mentra-neo -mt-20 w-full overflow-x-clip lg:-mt-28">
      <div className="neo-scroll-meter" aria-hidden="true">
        <motion.span style={{ scaleY: progressScale }} />
      </div>

      <section className="neo-hero neo-section">
        <div className="neo-grid-bg" aria-hidden="true" />
        <div className="neo-ambient neo-ambient-a" aria-hidden="true" />
        <div className="neo-ambient neo-ambient-b" aria-hidden="true" />

        <div className="neo-container grid min-h-[100dvh] items-center gap-8 pt-24 pb-16 lg:grid-cols-12 lg:gap-4 lg:pt-28">
          <div className="relative z-10 lg:col-span-7">
            <div className="neo-hero-meta neo-eyebrow">
              <span className="neo-live-dot" />
              Personal intelligence layer
            </div>

            <h1 className="neo-display mt-6 max-w-6xl text-[clamp(3.8rem,13vw,9.4rem)] lg:text-[clamp(5.2rem,8.4vw,9.2rem)]">
              <span className="neo-hero-line"><span className="neo-hero-line-inner">Your life.</span></span>
              <span className="neo-hero-line"><span className="neo-hero-line-inner neo-outline">One system.</span></span>
            </h1>

            <div className="neo-hero-meta mt-8 grid max-w-2xl gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-xl text-[15px] leading-7 text-white/58 sm:text-base">
                {displayName}, MENTRA connects goals, focus, money, memory and agents into one execution thread—without taking control away from you.
              </p>
              <button
                onClick={() => document.getElementById('command-layer')?.scrollIntoView({ behavior: 'smooth' })}
                className="neo-primary-button"
              >
                Open command <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="neo-hero-meta mt-12 grid max-w-2xl grid-cols-3 border-y border-white/10 py-5">
              <div>
                <div className="neo-metric-value">0{displayLevel}</div>
                <div className="neo-metric-label">Level</div>
              </div>
              <div className="border-l border-white/10 pl-5 sm:pl-8">
                <div className="neo-metric-value">{displayStreak}d</div>
                <div className="neo-metric-label">Streak</div>
              </div>
              <div className="border-l border-white/10 pl-5 sm:pl-8">
                <div className="neo-metric-value">{workingAgents.length}/{agents.length || 0}</div>
                <div className="neo-metric-label">Agents live</div>
              </div>
            </div>
          </div>

          <div className="neo-core-wrap relative h-[360px] w-full sm:h-[520px] lg:col-span-5 lg:h-[720px]">
            <div className="neo-core-halo" aria-hidden="true" />
            <MentraCore3D className="relative z-10 h-full w-full" />
            <div className="neo-core-caption">
              <span>CORE ONLINE</span>
              <span>XP {displayXp}/1000</span>
            </div>
          </div>
        </div>
      </section>

      <section className="neo-section neo-manifesto">
        <div className="neo-container">
          <div className="neo-reveal max-w-6xl">
            <div className="neo-eyebrow mb-8">Built around your direction</div>
            <p className="neo-manifesto-copy">
              {storyWords.map((word, index) => (
                <span key={index} className="neo-word">{word}{' '}</span>
              ))}
            </p>
          </div>
        </div>
      </section>

      <section id="command-layer" className="neo-section">
        <div className="neo-container grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="neo-reveal lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <div className="neo-eyebrow">Command</div>
            <h2 className="neo-heading mt-5">
              Say the outcome.<br />
              <span className="text-[#d8ff63]">Keep the thread.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/48">
              One natural-language entry point across your connected system. MENTRA keeps context attached while the right workflow takes over.
            </p>

            <div className="mt-10 hidden lg:block">
              <div className="neo-side-index">
                <span className="text-[#d8ff63]">01</span>
                <span>intent</span>
                <span>context</span>
                <span>action</span>
              </div>
            </div>
          </div>

          <div className="neo-reveal space-y-4 lg:col-span-8">
            <div className="neo-frame">
              <div className="neo-frame-topline">
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4 text-[#d8ff63]" />
                  <span>MENTRA COMMAND SURFACE</span>
                </div>
                <span>context aware</span>
              </div>
              <SystemStatus />
              <div className="mt-4">
                <CommandBar />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/goals" className="neo-quick-link">
                <span>Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/focus" className="neo-quick-link">
                <span>Focus</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/approvals" className="neo-quick-link">
                <span>Approve</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="neo-systems-pin neo-section">
        <div className="neo-container">
          <div className="neo-reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="neo-eyebrow">Life systems</div>
              <h2 className="neo-heading mt-5 max-w-4xl">Not six apps.<br />One operating context.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-white/45">
              Every layer can stay specialized without losing the decisions and goals that connect them.
            </p>
          </div>

          <div className="neo-systems-viewport mt-14">
            <div className="neo-systems-track grid gap-4 lg:flex lg:w-max">
              {lifeSystems.map((system, index) => {
                const Icon = system.icon;
                return (
                  <Link key={system.name} href={system.href} className="neo-system-card group">
                    <div className="flex items-center justify-between">
                      <span className="neo-card-index">{String(index + 1).padStart(2, '0')}</span>
                      <Icon className="h-5 w-5 text-[#d8ff63] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
                    </div>
                    <div className="mt-auto pt-20 lg:pt-28">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/36">{system.descriptor}</div>
                      <h3 className="mt-3 text-4xl font-medium tracking-[-0.045em]">{system.name}</h3>
                      <p className="mt-4 max-w-xs text-sm leading-6 text-white/48">{system.copy}</p>
                      <div className="mt-7 inline-flex items-center gap-2 text-sm text-white/72">
                        Open layer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="neo-section">
        <div className="neo-container">
          <div className="neo-reveal mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="neo-eyebrow">Daily execution</div>
              <h2 className="neo-heading mt-5">Intent becomes visible movement.</h2>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <div className="neo-big-number">{String(activeQuests.length).padStart(2, '0')}</div>
              <div className="neo-metric-label">active quests</div>
            </div>
          </div>

          <div className="neo-stack-wrap">
            <div className="neo-stack-card">
              <div className="neo-stack-copy">
                <span className="neo-card-index">A</span>
                <h3>Choose the next move.</h3>
                <p>Goals stay strategic. Quests turn them into work that can actually be finished today.</p>
                <Link href="/goals" className="neo-text-link">Open goals <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="neo-stack-visual">
                <div className="neo-orbit">
                  <Target className="h-8 w-8 text-[#d8ff63]" />
                </div>
              </div>
            </div>

            <div className="neo-stack-card">
              <div className="neo-stack-copy">
                <span className="neo-card-index">B</span>
                <h3>Keep momentum obvious.</h3>
                <p>{completedQuests} quests completed. The system keeps progress visible without turning your day into a spreadsheet.</p>
                <Link href="/quests" className="neo-text-link">Open quests <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="neo-stack-visual neo-stack-visual-data">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">execution signal</div>
                <div className="mt-5 text-7xl font-medium tracking-[-0.07em]">{completedQuests}</div>
                <div className="mt-2 text-sm text-white/42">completed</div>
              </div>
            </div>

            <div className="neo-stack-card">
              <div className="neo-stack-copy">
                <span className="neo-card-index">C</span>
                <h3>Work with context attached.</h3>
                <p>Money, memory and agents stay connected to the same decisions instead of living in isolated tools.</p>
                <Link href="/projects" className="neo-text-link">Open projects <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="neo-stack-visual">
                <div className="neo-network">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>

          <div className="neo-reveal mt-12">
            {activeQuests.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {activeQuests.slice(0, 3).map(quest => <QuestCard key={quest.id} quest={quest} />)}
              </div>
            ) : (
              <div className="neo-empty-state">
                <div>
                  <div className="text-sm font-medium">No active quest yet.</div>
                  <p className="mt-2 text-sm text-white/42">Create one clear move and give the day a direction.</p>
                </div>
                <Link href="/quests" className="neo-primary-button">Create quest <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="neo-section">
        <div className="neo-container grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="neo-reveal lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <div className="neo-eyebrow">Intelligence network</div>
            <h2 className="neo-heading mt-5">
              Agents act.<br />
              <span className="neo-serif">Memory makes it coherent.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/46">
              Specialists can handle narrow jobs while your memory layer preserves the why behind the work.
            </p>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="neo-reveal neo-frame">
              <div className="neo-frame-topline">
                <span>AGENT FLEET</span>
                <Link href="/agents">open all</Link>
              </div>
              <div className="mt-5 space-y-3">
                {agents.slice(0, 2).map(agent => <AgentStatusCard key={agent.id} agent={agent} />)}
                {agents.length === 0 && (
                  <div className="neo-inline-empty">No agents configured yet.</div>
                )}
              </div>
            </div>

            <div className="neo-reveal neo-frame">
              <div className="neo-frame-topline">
                <span>MEMORY VAULT</span>
                <Link href="/memory">open memory</Link>
              </div>
              <div className="mt-5 space-y-3">
                {memories.slice(0, 2).map(memory => <MemoryCard key={memory.id} memory={memory} />)}
                {memories.length === 0 && (
                  <div className="neo-inline-empty">MENTRA will build this layer as useful context is saved.</div>
                )}
              </div>
            </div>

            <div className="neo-reveal grid gap-3 sm:grid-cols-2">
              <div className="neo-data-block">
                <div className="neo-metric-label">Monthly income</div>
                <div className="mt-3 text-4xl font-medium tracking-[-0.05em]">₹{finance.monthlyIncome.toLocaleString()}</div>
              </div>
              <div className="neo-data-block">
                <div className="neo-metric-label">Goals tracked</div>
                <div className="mt-3 text-4xl font-medium tracking-[-0.05em]">{goals.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="neo-final neo-section">
        <div className="neo-container text-center">
          <div className="neo-reveal mx-auto max-w-6xl">
            <div className="neo-eyebrow justify-center">Your next useful move</div>
            <h2 className="neo-final-title mt-8">
              Less dashboard.<br />
              <span>More direction.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/48 sm:text-base">
              Use MENTRA as the layer that keeps your goals, context and execution connected while you keep the final say.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById('command-layer')?.scrollIntoView({ behavior: 'smooth' })}
                className="neo-primary-button"
              >
                Ask MENTRA <Zap className="h-4 w-4" />
              </button>
              <Link href="/system" className="neo-secondary-button">
                Open system <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
