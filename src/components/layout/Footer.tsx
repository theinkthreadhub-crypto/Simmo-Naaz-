import React from 'react';
import Link from 'next/link';
import { Bot, Heart, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-dark-800 bg-dark-950 text-dark-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Bot className="w-5 h-5 text-brand-500" />
            MENTRA PLATFORM
          </div>
          <p className="text-dark-400 text-xs leading-relaxed">
            All-in-one AI ecosystem combining Mental Wellness, Career Mentorship, Automated Fashion Studio, and D2C Commerce.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ALL SYSTEMS OPERATIONAL
          </div>
        </div>

        {/* AI Sanctuary */}
        <div className="space-y-2">
          <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">AI Sanctuary</h4>
          <ul className="space-y-1.5">
            <li><Link href="/wellness" className="hover:text-brand-300 transition">Mind & Mood Tracker</Link></li>
            <li><Link href="/wellness" className="hover:text-brand-300 transition">AI Reflection Therapy</Link></li>
            <li><Link href="/wellness" className="hover:text-brand-300 transition">Breathing Audio Visualizer</Link></li>
          </ul>
        </div>

        {/* Career & Fashion */}
        <div className="space-y-2">
          <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">Growth & Studio</h4>
          <ul className="space-y-1.5">
            <li><Link href="/mentorship" className="hover:text-brand-300 transition">Career Roadmaps</Link></li>
            <li><Link href="/mentorship" className="hover:text-brand-300 transition">AI Mock Interview Coach</Link></li>
            <li><Link href="/studio" className="hover:text-brand-300 transition">Streetwear T-Shirt Studio</Link></li>
            <li><Link href="/shop" className="hover:text-brand-300 transition">D2C Storefront</Link></li>
          </ul>
        </div>

        {/* Security & GitHub */}
        <div className="space-y-2">
          <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">Security & Repository</h4>
          <p className="text-dark-400 text-xs">
            Connected with repository: <br />
            <code className="text-[10px] text-brand-300 font-mono">theinkthreadhub-crypto/Simmo-Naaz-</code>
          </p>
          <div className="flex items-center gap-2 text-dark-300 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Client Isolation</span>
          </div>
        </div>
      </div>

      <div className="border-t border-dark-900 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-dark-500 text-[11px]">
        <div>© 2026 MENTRA Inc. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
          <span>•</span>
          <span>Connected to Git Remote: Origin</span>
        </div>
      </div>
    </footer>
  );
};
