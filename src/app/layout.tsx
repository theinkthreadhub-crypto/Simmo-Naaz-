import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'MENTRA — Personal AI Operating System',
  description: 'Your personal operating system for goals, tasks, money, learning, memory and AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowDemo =
    process.env.NODE_ENV !== 'production' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.MENTRA_DEMO_MODE === 'true';

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#090B0F] text-[#F5F7FA] antialiased">
        <AuthProvider allowDemo={allowDemo}>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
