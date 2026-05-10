import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary, NetworkStatusIndicator } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MMM Traders',
  description: 'Fresh Retail Business Management Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MMM Traders',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MMM Traders" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning className={`${outfit.className} bg-[#FFF9F5] text-slate-800 selection:bg-orange-500/30`}>
        <AuthProvider>
          <ErrorBoundary>
            <NetworkStatusIndicator />
            {children}
            <Toaster />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
