import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MENTRA — Personal AI Operating System',
  description: 'Futuristic Personal AI Operating System, Life RPG & AI Agent Command Center.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preload" as="video" href="/hero-loop.mp4" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#120400] text-white antialiased">
        <a className="skip-link" href="#main">Skip to content</a>
        <Navbar />
        <div id="main">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
