'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
    <path d="M14 1.6 20.3 8 14 14.4 7.7 8 14 1.6Z" fill="#FF6A00" />
    <path d="M6.4 9.3 12.7 15.7 6.4 22.1 0.1 15.7 6.4 9.3Z" fill="#FF3D00" />
    <path d="M21.6 9.3 27.9 15.7 21.6 22.1 15.3 15.7 21.6 9.3Z" fill="#FF9A2E" />
  </svg>
);

export const Menu = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const Close = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const links = [
  { label: 'Command Hub', href: '/' },
  { label: 'Life Quests', href: '/quests' },
  { label: 'Goals', href: '/goals' },
  { label: 'Finance HUD', href: '/finance' },
  { label: 'Skill Tree', href: '/skills' },
  { label: 'Memory Vault', href: '/memory' },
  { label: 'Agent Fleet', href: '/agents' },
  { label: 'Journal', href: '/journal' },
  { label: 'Connections', href: '/connections' },
  { label: 'Reports', href: '/reports' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="nav">
      <Link className="nav__brand" href="/">
        <Logo className="nav__logo" />
        <span>MENTRA</span>
      </Link>

      <nav className="nav__pill" aria-label="Primary">
        <ul>
          {links.slice(0, 6).map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={pathname === link.href ? 'nav__link--active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="nav__actions">
        <Link className="btn btn--light nav__cta" href="/quests">
          Enter System
        </Link>
        <button
          className="nav__burger"
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="nav__sheet">
          <ul>
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={pathname === link.href ? 'text-amber-400 font-semibold' : ''}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="btn btn--flame nav__sheet-cta"
            href="/quests"
            onClick={() => setOpen(false)}
          >
            Enter System
          </Link>
        </div>
      )}
    </header>
  );
}
