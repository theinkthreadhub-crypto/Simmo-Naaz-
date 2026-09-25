'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ListTodo,
  Sparkles,
  TrendingUp,
  Menu,
  X,
  Target,
  Repeat2,
  Wallet,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Bot,
  Plug,
  Brain,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const moreRoutes = [
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/habits', label: 'Habits', icon: Repeat2 },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/skills', label: 'Learning', icon: GraduationCap },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/connections', label: 'Integrations', icon: Plug },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileDock() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'You';

  const coreItems = [
    { href: '/', label: 'Today', icon: Home },
    { href: '/quests', label: 'Tasks', icon: ListTodo },
    { href: '/mentra', label: 'Mentor', icon: Sparkles, primary: true },
    { href: '/skills', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <>
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 h-14 border-b border-[#292F3B] bg-[#090B0F]/95 px-4 flex items-center justify-between">
        <Link href="/" className="min-h-11 flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-xl bg-[#B7FF3C] text-[#090B0F] flex items-center justify-center font-display text-xs">
            M
          </span>
          <div>
            <div className="font-display text-sm leading-none">MENTRA</div>
            <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.14em] text-[#697181]">Personal OS</div>
          </div>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="h-11 w-11 rounded-xl border border-[#292F3B] bg-[#161A22] flex items-center justify-center text-[#A1A8B5]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-50 rounded-[18px] border border-[#292F3B] bg-[#10131A]/98 p-1.5 flex items-stretch justify-between">
        {coreItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/' ? pathname === '/' : pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-12 min-w-[58px] rounded-xl px-2 flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
                item.primary
                  ? 'bg-[#B7FF3C] text-[#090B0F] font-semibold'
                  : active
                    ? 'bg-[#1C212B] text-[#F5F7FA]'
                    : 'text-[#697181]'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setDrawerOpen(true)}
          className="min-h-12 min-w-[58px] rounded-xl px-2 flex flex-col items-center justify-center gap-1 text-[10px] text-[#697181]"
        >
          <Menu className="h-[18px] w-[18px]" />
          <span>More</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#090B0F] p-4 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#292F3B] pb-4">
            <div>
              <div className="font-display text-xl">MORE</div>
              <div className="mt-1 text-xs text-[#697181]">Everything in your system.</div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="h-11 w-11 rounded-xl border border-[#292F3B] bg-[#161A22] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#292F3B] bg-[#161A22] p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">Signed in</div>
            <div className="mt-1 font-semibold">{displayName}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 overflow-y-auto pb-4">
            {moreRoutes.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`min-h-[64px] rounded-2xl border p-3 flex items-center gap-3 ${
                    active
                      ? 'border-[#B7FF3C]/50 bg-[#B7FF3C]/10 text-[#F5F7FA]'
                      : 'border-[#292F3B] bg-[#161A22] text-[#A1A8B5]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] text-[#B7FF3C]" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <button
            onClick={async () => {
              setDrawerOpen(false);
              await signOut();
            }}
            className="mt-auto min-h-12 rounded-xl border border-[#FF5C5C]/30 bg-[#FF5C5C]/10 text-[#FF8A8A] flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
