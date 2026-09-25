'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Cpu, 
  Sword, 
  Target, 
  DollarSign, 
  Brain, 
  BookOpen, 
  Bot, 
  ChevronDown, 
  Calendar, 
  HardDrive, 
  FileText, 
  Share2, 
  Settings, 
  LogOut,
  Sparkles,
  Flame,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMentraStore } from '@/lib/store/mentraStore';

const primaryNavItems = [
  { href: '/mentra', label: 'MENTRA AI', icon: Sparkles },
  { href: '/system', label: 'System', icon: Cpu },
  { href: '/quests', label: 'Quests', icon: Sword },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/agents', label: 'Agents', icon: Bot },
];

const secondaryNavItems = [
  { href: '/workspace/settings', label: 'Team & Collaboration', icon: Users },
  { href: '/business', label: 'Business Hub', icon: DollarSign },
  { href: '/creator', label: 'Creator Studio', icon: Sparkles },
  { href: '/mentra/voice', label: 'Voice MENTRA', icon: Sparkles },
  { href: '/missions', label: 'Missions & Plans', icon: Target },
  { href: '/habits', label: 'Habits & Rhythms', icon: Flame },
  { href: '/projects', label: 'Projects & Decisions', icon: Sparkles },
  { href: '/focus', label: 'Focus Mode', icon: Cpu },
  { href: '/approvals', label: 'Approval Center', icon: ShieldCheck },
  { href: '/settings/autonomy', label: 'Autonomy Matrix', icon: ShieldCheck },
  { href: '/settings/personalization', label: 'Personalization Scopes', icon: Brain },
  { href: '/system/improvements', label: 'Improvement Center', icon: Sparkles },
  { href: '/system/quality', label: 'Quality Dashboard', icon: Cpu },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/memory', label: 'Memory Vault', icon: HardDrive },
  { href: '/reports', label: 'Executive Reports', icon: FileText },
  { href: '/connections', label: 'Connections', icon: Share2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function PillNavbar() {
  const pathname = usePathname();
  const { user, profile, progress, signOut } = useAuth();
  const { player } = useMentraStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayLevel = progress?.level ?? player.level;
  const displayXp = progress?.current_xp ?? player.currentXp;
  const displayStreak = progress?.current_streak ?? player.streakDays;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Operator Naaz';

  return (
    <header className="hidden lg:flex fixed top-5 inset-x-0 z-50 justify-center px-6 pointer-events-none">
      <div className="w-full max-w-7xl flex items-center justify-between pointer-events-auto">
        
        {/* Left: Brand Wordmark */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 px-4 py-2 glass-pill bg-black/40 border-white/10 hover:border-mentra-orange/40 transition-all group"
        >
          <div className="w-2 h-2 rounded-full bg-mentra-orange animate-pulse shadow-[0_0_8px_#ff4a00]" />
          <span className="font-display font-bold tracking-wider text-sm text-white group-hover:text-mentra-amber transition-colors">
            MENTRA
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            OS
          </span>
        </Link>

        {/* Center: Main Navigation Capsule */}
        <nav className="flex items-center gap-1 p-1.5 glass-pill bg-black/60 border-white/10 shadow-2xl backdrop-blur-2xl">
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-mentra-orange to-mentra-amber text-white shadow-[0_0_15px_rgba(255,74,0,0.4)]'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Secondary Dropdown Capsule */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <span>More</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-3 w-48 p-1.5 glass-panel-strong border-white/10 shadow-2xl rounded-2xl flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {secondaryNavItems.map(sub => {
                  const SubIcon = sub.icon;
                  const isSubActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                        isSubActive 
                          ? 'bg-mentra-orange/20 text-mentra-amber border border-mentra-orange/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 text-mentra-amber" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Player Status & Profile */}
        <div className="relative flex items-center gap-2">
          {/* Level & Streak Quick Badge */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 glass-pill bg-black/40 border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-mentra-amber font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-mentra-orange" />
              <span>LVL {displayLevel}</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1 text-white/80 font-mono text-[11px]">
              <Flame className="w-3.5 h-3.5 text-mentra-orange" />
              <span>{displayStreak}d</span>
            </div>
          </div>

          {/* Profile Trigger */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 glass-pill bg-black/40 border-white/10 hover:border-mentra-orange/40 transition-all text-left"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-mentra-orange to-mentra-amber flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,74,0,0.4)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-white/90 max-w-[100px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3 h-3 text-white/40" />
          </button>

          {/* Profile & Session Dropdown */}
          {profileOpen && (
            <div 
              className="absolute right-0 top-12 w-56 p-2 glass-panel-strong border-white/10 shadow-2xl rounded-2xl flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                <div className="text-[10px] font-mono text-white/40 truncate">{user?.email || 'operator@mentra.system'}</div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-mentra-amber">
                  <span>XP: {displayXp} / 1000</span>
                  <span>{Math.round((displayXp / 1000) * 100)}%</span>
                </div>
                <div className="mt-1 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-mentra-orange to-mentra-amber rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((displayXp / 1000) * 100))}%` }} 
                  />
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-white/60" />
                <span>Operator Settings</span>
              </Link>

              <button
                onClick={async () => {
                  setProfileOpen(false);
                  await signOut();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect / Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
