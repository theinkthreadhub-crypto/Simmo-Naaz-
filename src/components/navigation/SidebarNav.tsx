'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Target,
  Compass,
  DollarSign,
  TrendingUp,
  BookOpen,
  Calendar,
  Brain,
  Cpu,
  FileText,
  Link2,
  Settings,
  Terminal
} from 'lucide-react';

const navItems = [
  { name: 'System', href: '/system', icon: Activity },
  { name: 'Quests', href: '/quests', icon: Target },
  { name: 'Goals', href: '/goals', icon: Compass },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Skills', href: '/skills', icon: TrendingUp },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Agents', href: '/agents', icon: Cpu },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Connections', href: '/connections', icon: Link2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#0a0c13]/90 backdrop-blur-xl h-screen sticky top-0 z-40 p-4 justify-between">
      <div>
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-3 py-3 mb-6 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/10">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-widest text-sm flex items-center gap-1.5">
              MENTRA
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-[10px] font-mono text-cyan-400/80">AI OPERATING SYSTEM</div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Chip */}
      <div className="p-3 rounded-2xl bg-[#0d1017] border border-white/10 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
          <span>MENTRA CORE</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
