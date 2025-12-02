import type {Metadata, Viewport} from 'next';
import {GeistSans} from 'geist/font/sans';
import {GeistMono} from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Echo',
  description: 'Exclusive Messaging App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Echo',
  },
  mobileWebApp: true,
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(0 0% 100%)' }, // White
    { media: '(prefers-color-scheme: dark)', color: 'hsl(0 0% 8%)' }, // Almost black
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
