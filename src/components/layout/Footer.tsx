'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#120400] text-slate-400 py-10 px-6 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5b6cff] animate-pulse" />
          <span className="text-white font-bold tracking-wider">MENTRA ONLINE</span>
          <span className="text-slate-500">— Personal AI Operating System</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <Link href="/quests" className="hover:text-cyan-400 transition">Quests</Link>
          <Link href="/goals" className="hover:text-cyan-400 transition">Goals</Link>
          <Link href="/finance" className="hover:text-cyan-400 transition">Finance</Link>
          <Link href="/skills" className="hover:text-cyan-400 transition">Skills</Link>
          <Link href="/agents" className="hover:text-cyan-400 transition">Agents</Link>
        </div>

        <div className="text-slate-600 text-[11px]">
          © {new Date().getFullYear()} MENTRA OS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
