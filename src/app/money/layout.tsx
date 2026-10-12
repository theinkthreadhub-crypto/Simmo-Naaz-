import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Money Tracker — MENTRA',
  description: 'Enter an amount and AI picks the category. See where your money went in a pie chart.',
  manifest: '/money.webmanifest',
  appleWebApp: { capable: true, title: 'Money', statusBarStyle: 'black-translucent' },
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
