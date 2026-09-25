'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  ListTodo,
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
  Search,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const navItems = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/mentra', label: 'AI Mentor', icon: Sparkles },
  { href: '/quests', label: 'Tasks', icon: ListTodo },
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

const pageNames: Record<string, string> = {
  '/': 'Today',
  '/mentra': 'AI Mentor',
  '/quests': 'Tasks',
  '/goals': 'Goals',
  '/habits': 'Habits',
  '/finance': 'Finance',
  '/journal': 'Journal',
  '/skills': 'Learning',
  '/calendar': 'Calendar',
  '/agents': 'Agents',
  '/connections': 'Integrations',
  '/memory': 'Memory',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function PillNavbar() {
  const pathname = usePathname();
  const { user, profile, progress, signOut } = useAuth();
  const { player } = useMentraStore();

  const displayLevel = progress?.level ?? player.level;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'You';
  const pageTitle =
    pageNames[pathname] ||
    Object.entries(pageNames).find(([key]) => key !== '/' && pathname?.startsWith(key))?.[1] ||
    'MENTRA';

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[#292F3B] bg-[#10131A] p-4 flex-col">
        <Link href="/" className="min-h-11 flex items-center gap-3 rounded-2xl px-3">
          <div className="h-9 w-9 rounded-xl bg-[#B7FF3C] text-[#090B0F] flex items-center justify-center font-display text-sm">
            M
          </div>
          <div>
            <div className="font-display text-sm tracking-tight">MENTRA</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">
              Personal OS
            </div>
          </div>
        </Link>

        <div className="mt-5 px-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">
          Your system
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto pr-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-11 flex items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                  active
                    ? 'bg-[#B7FF3C] text-[#090B0F] font-semibold'
                    : 'text-[#A1A8B5] hover:bg-[#1C212B] hover:text-[#F5F7FA]'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-[#292F3B] pt-4">
          <div className="rounded-2xl border border-[#292F3B] bg-[#161A22] p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full border border-[#3A424F] bg-[#1C212B] flex items-center justify-center text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="text-[11px] font-mono text-[#697181]">Level {displayLevel}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#4DDB8A]" aria-label="System online" />
            </div>
            <button
              onClick={() => signOut()}
              className="mt-3 min-h-11 w-full rounded-xl border border-[#292F3B] text-xs text-[#A1A8B5] hover:bg-[#1C212B] hover:text-[#F5F7FA] flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <header className="hidden lg:flex fixed top-0 left-[264px] right-0 z-40 h-16 items-center justify-between border-b border-[#292F3B] bg-[#090B0F]/95 px-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#697181]">MENTRA</div>
          <div className="font-display text-sm">{pageTitle}</div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mentra"
            className="min-h-11 w-[360px] rounded-xl border border-[#292F3B] bg-[#161A22] px-4 flex items-center gap-3 text-sm text-[#697181] hover:border-[#3A424F] hover:text-[#A1A8B5]"
          >
            <Search className="h-4 w-4" />
            <span>Ask MENTRA or search anything...</span>
            <span className="ml-auto font-mono text-[10px]">⌘K</span>
          </Link>
          <Link
            href="/system"
            aria-label="Notifications and system status"
            className="h-11 w-11 rounded-xl border border-[#292F3B] bg-[#161A22] flex items-center justify-center text-[#A1A8B5] hover:text-[#F5F7FA]"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>
    </>
  );
}
