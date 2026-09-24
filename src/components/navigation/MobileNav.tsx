'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Target,
  DollarSign,
  Cpu,
  Brain,
  TrendingUp
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Core', href: '/', icon: Activity },
  { name: 'Quests', href: '/quests', icon: Target },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Skills', href: '/skills', icon: TrendingUp },
  { name: 'Agents', href: '/agents', icon: Cpu },
  { name: 'Memory', href: '/memory', icon: Brain },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07090e]/95 border-t border-white/10 backdrop-blur-2xl px-2 py-2">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-mono transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
