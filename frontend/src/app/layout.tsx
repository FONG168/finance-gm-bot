import type { Metadata, Viewport } from 'next';
import { Inter, Nunito } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/providers/ClientProviders';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const nunito = Nunito({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'Finance GM',
  description: 'Smart Money Platform — Personal finance management for Telegram',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Finance GM' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} font-sans min-h-screen bg-background antialiased overflow-x-hidden`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
