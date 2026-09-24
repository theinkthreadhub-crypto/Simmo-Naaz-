'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Heart,
  Compass,
  Palette,
  ShoppingBag,
  Menu,
  X,
  Bot,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: 'Hub', href: '/', icon: Sparkles },
    { name: 'Mind & Wellness', href: '/wellness', icon: Heart, badge: 'AI Sanctuary' },
    { name: 'Career & Mentorship', href: '/mentorship', icon: Compass, badge: 'Roadmaps' },
    { name: 'Fashion AI Studio', href: '/studio', icon: Palette, badge: '300 DPI' },
    { name: 'Storefront', href: '/shop', icon: ShoppingBag, badge: 'D2C' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-800/80 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-accent to-brand-cyan p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-cyan" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-dark-100 to-brand-300 bg-clip-text text-transparent">
              MENTRA
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 text-brand-300 rounded-full">
              AI Super-Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all relative group',
                  isActive
                    ? 'bg-dark-850 text-white border border-dark-700 shadow-sm'
                    : 'text-dark-300 hover:text-white hover:bg-dark-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-brand-500' : 'text-dark-400 group-hover:text-brand-400')} />
                <span>{link.name}</span>
                {link.badge && !isActive && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-dark-800 text-dark-400 rounded-md border border-dark-700/50">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/studio"
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent/90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Launch Studio
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-dark-900 border border-dark-800 text-dark-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-dark-800 bg-dark-950 p-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl text-xs font-semibold',
                pathname === link.href
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-dark-300 hover:bg-dark-900 hover:text-white'
              )}
            >
              <div className="flex items-center gap-2.5">
                <link.icon className="w-4 h-4" />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-dark-800 text-dark-400 rounded-md">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
