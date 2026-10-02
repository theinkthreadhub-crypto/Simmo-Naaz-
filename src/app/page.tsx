'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Sparkles, Share2, Zap, TrendingUp,
  ArrowUpRight, Brain, Shield, Terminal, Play, CheckCircle2,
  Sliders, ArrowRight, Eye, RefreshCw, Copy, Layers, Target, Compass
} from 'lucide-react';

// Dynamic import for R3F 3D Background Scene (no SSR)
const JoanHeroScene3D = dynamic(() => import('@/components/home/JoanHeroScene3D'), {
  ssr: false,
});

/* ──────────────────────────────────────────────
   CURSOR GLOW FOLLOWER
────────────────────────────────────────────── */
function CursorGlow() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-50 w-[450px] h-[450px] rounded-full opacity-20 blur-[120px] bg-gradient-to-r from-orange-500 via-amber-400 to-purple-600"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    />
  );
}

/* ──────────────────────────────────────────────
   NOISE TEXTURE OVERLAY
────────────────────────────────────────────── */
function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 opacity-[0.035] mix-blend-overlay">
      <svg className="w-full h-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────
   3D MAGNETIC TILT CARD
────────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / -12);
    setRotateY((x - centerX) / 12);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{ transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   MAIN HOMEPAGE COMPONENT
────────────────────────────────────────────── */
export default function MentraJoanHomePage() {
  const mouse = useRef<[number, number]>([0, 0]);

  // Terminal Simulator State
  const [activeTab, setActiveTab] = useState<'hunt' | 'ugc' | 'growth'>('hunt');
  const [terminalInput, setTerminalInput] = useState('Oversized Acid-Wash Hoodies');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<{
    title: string;
    hook: string;
    body: string;
    cta: string;
    metrics: string;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth - 0.5) * 2,
      -(e.clientY / window.innerHeight - 0.5) * 2,
    ];
  };

  const runTerminalDemo = () => {
    setIsGenerating(true);
    setGeneratedOutput(null);
    setTimeout(() => {
      setIsGenerating(false);
      if (activeTab === 'hunt') {
        setGeneratedOutput({
          title: `🔥 TOP TREND: ${terminalInput}`,
          hook: 'Viral Index: 98.4/100 · Competition Score: LOW',
          body: 'Sourcing Cost: ₹340 | Recommended Retail: ₹1,499 | Profit Margin: 77%',
          cta: 'Supplier Links & AliExpress API mapping ready.',
          metrics: 'Est. Monthly Sales: 1,400+ units',
        });
      } else if (activeTab === 'ugc') {
        setGeneratedOutput({
          title: `🎬 INSTAGRAM REEL SCRIPT: ${terminalInput}`,
          hook: '"Stop buying boring basic hoodies until you see this Japanese heavyweight cotton stitch..."',
          body: '[Visual: Close up fabric texture + slow-mo drop] "350 GSM custom French terry with double-needle hems. No shrinking after 50 washes."',
          cta: '"Tap link in bio to get ₹400 off launch drop today."',
          metrics: 'Est. Reel Views: 450K - 1.2M',
        });
      } else {
        setGeneratedOutput({
          title: `📊 REVENUE OPTIMIZER: ${terminalInput}`,
          hook: 'Ad Spend Allocation: 60% Meta Ads, 40% Instagram Creator Whitelisting',
          body: 'Target CPA: ₹210 | Projected ROAS: 4.8x | Breakeven Conversion Rate: 1.8%',
          cta: 'Autopilot campaign structure configured for Meta Ads Manager.',
          metrics: 'Projected Monthly Net Profit: ₹4.2 Lakhs',
        });
      }
    }, 900);
  };

  useEffect(() => {
    runTerminalDemo();
  }, [activeTab]);

  return (
    <div
      className="relative min-h-screen bg-[#070709] text-white overflow-hidden selection:bg-orange-500/30 selection:text-orange-200"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <CursorGlow />
      <NoiseOverlay />

      {/* 3D Background Scene */}
      <JoanHeroScene3D mouse={mouse} />

      {/* Grid Pattern Layer */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* ──────────────────────────────────────────────
         HEADER NAVBAR
      ────────────────────────────────────────────── */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black font-extrabold" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-[0.18em] uppercase text-white font-mono">MENTRA</span>
            <span className="text-[9px] font-mono text-orange-400/80 tracking-widest uppercase">Sovereign OS</span>
          </div>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          {[
            ['Product Hunt', '#hunt'],
            ['UGC Studio', '#ugc'],
            ['Competitor Radar', '#radar'],
            ['✨ Gemini AI', '/gemini'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-xs font-mono text-white/60 hover:text-orange-400 transition-colors tracking-wider"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/gemini"
            className="relative group overflow-hidden px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-black font-bold text-xs tracking-wide shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              Launch Console <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </header>

      {/* ──────────────────────────────────────────────
         HERO SECTION
      ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-mono tracking-[0.2em] mb-8 shadow-inner"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          MENTRA v4.2 · SOVEREIGN FASHION AI OS
        </motion.div>

        {/* Editorial Playfair Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.06] mb-8 text-white"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Where Fashion Brands
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent italic font-normal">
            Automate Dominance.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-base sm:text-lg text-white/50 mb-12 leading-relaxed font-light"
        >
          Hunt viral apparel trends, generate viral Instagram/TikTok UGC video scripts, automate competitor spy operations, and scale profit margins — all driven by Gemini AI.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          <Link
            href="/gemini"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-orange-500/25 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-black fill-black" />
            Open Gemini AI Studio
          </Link>
          <a
            href="#terminal"
            className="px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-orange-500/40 text-white font-medium text-sm tracking-wide backdrop-blur-lg hover:bg-white/[0.08] transition-all flex items-center gap-2"
          >
            <Terminal className="w-4 h-4 text-orange-400" />
            Interactive Terminal Demo
          </a>
        </motion.div>

        {/* ──────────────────────────────────────────────
           INTERACTIVE TERMINAL CONSOLE DEMO
        ────────────────────────────────────────────── */}
        <motion.div
          id="terminal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#0d0a08]/90 backdrop-blur-2xl shadow-2xl shadow-orange-500/10 overflow-hidden text-left"
        >
          {/* Terminal Window Bar */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-white/40 tracking-wider">mentra-core // terminal-v4.2</span>
            </div>
            {/* Terminal Tab Pickers */}
            <div className="flex gap-2">
              {[
                { id: 'hunt', label: '⚡ Trend Hunter', color: 'text-orange-400 border-orange-500/40' },
                { id: 'ugc', label: '🎬 UGC Script Generator', color: 'text-violet-400 border-violet-500/40' },
                { id: 'growth', label: '📊 Growth Autopilot', color: 'text-emerald-400 border-emerald-500/40' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white font-bold border-white/30 shadow-sm'
                      : 'text-white/40 border-transparent hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-6 sm:p-8 font-mono">
            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-orange-400 text-sm">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Enter apparel product or niche..."
                  className="w-full bg-transparent text-sm text-white focus:outline-none font-mono placeholder:text-white/20"
                />
              </div>
              <button
                onClick={runTerminalDemo}
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-orange-500 text-black font-bold text-xs tracking-wider uppercase hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" /> Execute AI
                  </>
                )}
              </button>
            </div>

            {/* Generated Console Output Card */}
            <div className="min-h-[160px] p-5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs leading-relaxed relative">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-8 gap-3 text-white/40"
                  >
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <span>Querying Gemini 1.5 Flash fashion neural network...</span>
                  </motion.div>
                ) : generatedOutput ? (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-orange-400 font-bold text-sm">
                      <span>{generatedOutput.title}</span>
                      <span className="text-[10px] text-white/30 border border-white/10 px-2 py-0.5 rounded">STATUS 200 OK</span>
                    </div>
                    <p className="text-amber-300/90">{generatedOutput.hook}</p>
                    <p className="text-white/70">{generatedOutput.body}</p>
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-white/40 text-[11px]">
                      <span className="text-emerald-400 font-semibold">{generatedOutput.cta}</span>
                      <span className="text-violet-400 font-bold">{generatedOutput.metrics}</span>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ──────────────────────────────────────────────
         STATS COUNTER MATRIX
      ────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.01] backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '₹4.8Cr+', label: 'Fashion GMV Tracked', color: 'text-orange-400' },
            { value: '98.4%', label: 'Trend Accuracy', color: 'text-emerald-400' },
            { value: '4.8x', label: 'Average Ad ROAS', color: 'text-amber-400' },
            { value: '< 15s', label: 'AI Script Gen Time', color: 'text-violet-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <h3 className={`text-4xl sm:text-5xl font-black ${stat.color} tracking-tight font-mono`}>{stat.value}</h3>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
         3D MAGNETIC PRODUCT MATRIX (PRODUCT HUNTER)
      ────────────────────────────────────────────── */}
      <section id="hunt" className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono text-orange-400 uppercase tracking-[0.25em]">AI Product Hunter</span>
          <h2
            className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Unfair Product Intelligence.
          </h2>
          <p className="text-white/50 text-sm font-light leading-relaxed">
            Mentra scans real-time search volume, social engagement spikes, and manufacturer margins to serve winner apparel products before competitors spot them.
          </p>
        </div>

        {/* 3D Tilt Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Heavyweight Boxy Tee',
              niche: 'Streetwear / Acid Wash',
              margin: '77%',
              demand: '98/100',
              sourcing: '₹340',
              retail: '₹1,499',
              tag: 'TOP VIRAL',
              tagColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            },
            {
              name: 'Parachute Cargo Trousers',
              niche: 'Y2K / Techwear',
              margin: '72%',
              demand: '94/100',
              sourcing: '₹520',
              retail: '₹1,899',
              tag: 'HIGH MARGIN',
              tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            },
            {
              name: 'Vintage Biker Jacket',
              niche: 'Outerwear / Faux Leather',
              margin: '81%',
              demand: '91/100',
              sourcing: '₹1,100',
              retail: '₹3,999',
              tag: 'LOW COMPETITION',
              tagColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            },
          ].map((item, i) => (
            <TiltCard
              key={item.name}
              className="p-7 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-orange-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <span className="text-xs font-mono text-white/30">{item.niche}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  {item.name}
                </h3>
                <div className="grid grid-cols-2 gap-4 py-4 my-4 border-y border-white/5 font-mono text-xs">
                  <div>
                    <span className="text-white/30 block text-[10px] uppercase">Est. Margin</span>
                    <span className="text-emerald-400 font-bold text-base">{item.margin}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block text-[10px] uppercase">Demand Index</span>
                    <span className="text-orange-400 font-bold text-base">{item.demand}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block text-[10px] uppercase">Sourcing Cost</span>
                    <span className="text-white/80">{item.sourcing}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block text-[10px] uppercase">Target Retail</span>
                    <span className="text-white/80">{item.retail}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/mentra"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-orange-500 hover:text-black border border-white/10 text-white font-mono text-xs text-center transition-all flex items-center justify-center gap-2 font-semibold"
              >
                Analyze Sourcing Data <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
         UGC SCRIPT & CONTENT ENGINE
      ────────────────────────────────────────────── */}
      <section id="ugc" className="relative z-10 border-t border-white/10 bg-white/[0.01] py-28">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-mono text-violet-400 uppercase tracking-[0.25em]">Automated Content Studio</span>
            <h2
              className="text-4xl sm:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Generate Viral UGC Video Scripts in Seconds.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed font-light">
              Stop wasting thousands on content agencies. Mentra creates viral Reels, TikTok hooks, and full UGC creator scripts tailored specifically for high-converting fashion ad drops.
            </p>
            <div className="space-y-4 pt-4 font-mono text-xs">
              {[
                'Psychologically engineered hook templates (3-sec retention lock)',
                'Frame-by-frame visual directions & camera shot notes',
                '1-Click voiceover audio script export for ElevenLabs & Reels',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Link
                href="/creator"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-violet-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Open UGC Script Studio
              </Link>
            </div>
          </div>

          {/* UGC Interactive Preview Box */}
          <div className="p-8 rounded-3xl bg-[#0c0a10] border border-violet-500/30 shadow-2xl shadow-violet-500/10 space-y-4 font-mono">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
              <span className="text-violet-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> INSTAGRAM REEL SCRIPT #104
              </span>
              <span className="text-white/30 text-[10px]">FORMAT: 9:16 VERTICAL</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-[10px] text-orange-400 uppercase tracking-wider block font-bold">🎣 HOOK (0.0s - 2.5s)</span>
              <p className="text-xs text-white/90">"If you're still buying ₹2,000 oversized tees that lose shape after one wash... watch this."</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">📹 VISUAL BODY (2.5s - 10s)</span>
              <p className="text-xs text-white/70">Macro shot showing double-stitched collar density + stretch test. Cut to model wearing tee with cargo pants.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">⚡ CALL TO ACTION (10s - 15s)</span>
              <p className="text-xs text-white/90">"Use code DROP20 for 20% off our launch batch. Link in bio."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
         GEMINI AI CALLOUT BANNER
      ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl p-10 sm:p-16 overflow-hidden bg-gradient-to-r from-orange-950/60 via-[#100b07] to-purple-950/60 border border-orange-500/30 text-center">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-xs font-mono text-orange-400 uppercase tracking-[0.3em]">Powered by Google Gemini 1.5</span>
            <h2
              className="text-4xl sm:text-6xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ask Gemini Anything About Your Brand.
            </h2>
            <p className="text-white/60 text-sm font-light leading-relaxed">
              Analyze product photos, query pricing strategies, generate ad copy, or optimize supply chain logistics through our dedicated Gemini chat console.
            </p>
            <div className="pt-4">
              <Link
                href="/gemini"
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-orange-500/30 hover:scale-105 transition-all"
              >
                Launch Gemini Chat Console →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
         FOOTER
      ────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050406] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-white/40">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black font-bold" />
            </div>
            <span className="text-white font-bold tracking-wider">MENTRA OS</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/mentra" className="hover:text-white transition-colors">Console</Link>
            <Link href="/gemini" className="hover:text-white transition-colors">Gemini AI</Link>
            <Link href="/finance" className="hover:text-white transition-colors">Growth</Link>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
