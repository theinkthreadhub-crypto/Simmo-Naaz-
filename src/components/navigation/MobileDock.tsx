'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Sword, 
  Bot, 
  TrendingUp, 
  Menu, 
  X, 
  DollarSign, 
  Brain, 
  BookOpen, 
  Calendar, 
  HardDrive, 
  Share2, 
  Settings, 
  LogOut,
  Sparkles,
  Flame
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

export default function MobileDock() {
  const pathname = usePathname();
  const { user, profile, progress, signOut } = useAuth();
  const { player } = useMentraStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const displayLevel = progress?.level ?? player.level;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator';

  const menuRoutes = [
    { href: '/goals', label: 'Macro Goals', icon: TrendingUp },
    { href: '/finance', label: 'Finance HUD', icon: DollarSign },
    { href: '/skills', label: 'Skill Matrix', icon: Brain },
    { href: '/journal', label: 'Daily Journal', icon: BookOpen },
    { href: '/calendar', label: 'Calendar Focus', icon: Calendar },
    { href: '/memory', label: 'Neural Memory', icon: HardDrive },
    { href: '/connections', label: 'Connected Apps', icon: Share2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Compact Brand Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mentra-orange animate-pulse shadow-[0_0_6px_#ff4a00]" />
          <span className="font-display font-bold tracking-wider text-sm text-white">MENTRA</span>
          <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 px-1 py-0.5 rounded bg-white/5">
            OS
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 glass-pill bg-white/5 border-white/10 text-xs">
            <Sparkles className="w-3 h-3 text-mentra-amber" />
            <span className="font-mono text-mentra-amber font-semibold">L{displayLevel}</span>
            <div className="w-[1px] h-2.5 bg-white/10" />
            <Flame className="w-3 h-3 text-mentra-orange" />
            <span className="font-mono text-white/70 text-[10px]">{displayStreak}d</span>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Glass Navigation Dock */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-50">
        <div className="flex items-center justify-around p-2 glass-pill bg-black/80 border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              pathname === '/' ? 'text-mentra-amber font-medium' : 'text-white/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </Link>

          {/* Quests */}
          <Link
            href="/quests"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              pathname === '/quests' ? 'text-mentra-amber font-medium' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sword className="w-4 h-4" />
            <span className="text-[10px]">Quests</span>
          </Link>

          {/* Center Elevated MENTRA AI Button */}
          <Link
            href="/agents"
            className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-full bg-gradient-to-tr from-mentra-orange to-mentra-amber text-white shadow-[0_0_20px_rgba(255,74,0,0.5)] border-2 border-black active:scale-95 transition-all"
          >
            <Bot className="w-5 h-5" />
          </Link>

          {/* Progress (Skills & Goals) */}
          <Link
            href="/skills"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              pathname === '/skills' || pathname === '/goals' ? 'text-mentra-amber font-medium' : 'text-white/60 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="text-[10px]">Progress</span>
          </Link>

          {/* Drawer Trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-full text-white/60 hover:text-white"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </div>

      {/* Full Screen Slide-in Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-6 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-mentra-orange shadow-[0_0_8px_#ff4a00]" />
                <span className="font-display font-bold text-white text-base">MENTRA OS</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Brief in Drawer */}
            <div className="mt-4 p-3 glass-panel border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-mentra-orange to-mentra-amber flex items-center justify-center font-bold text-white shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{displayName}</div>
                <div className="text-xs font-mono text-mentra-amber">Level {displayLevel} • {displayStreak} Day Streak</div>
              </div>
            </div>

            {/* All Routes Grid */}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {menuRoutes.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs transition-all ${
                      isActive 
                        ? 'bg-mentra-orange/20 text-mentra-amber border border-mentra-orange/40'
                        : 'bg-white/5 text-white/80 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-mentra-orange" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={async () => {
                setDrawerOpen(false);
                await signOut();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
