import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Paisa Tracker — MENTRA',
  description: 'Amount daalo, AI khud category chunega. Pie chart se dekho paisa kahan gaya.',
  manifest: '/money.webmanifest',
  appleWebApp: { capable: true, title: 'Paisa', statusBarStyle: 'black-translucent' },
  icons: { icon: '/money-icon-192.png', apple: '/money-icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b1220',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
