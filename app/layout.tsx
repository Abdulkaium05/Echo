
import type {Metadata} from 'next';
import {GeistSans} from 'geist/font/sans';
import {GeistMono} from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { BlockUserProvider } from '@/context/block-user-context';
import { TrashProvider } from '@/context/trash-context'; // Import the new provider
import { SoundProvider } from '@/context/sound-context';

export const metadata: Metadata = {
  title: 'echo', // Updated app title
  description: 'Exclusive Messaging App',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Echo',
  },
  mobileWebApp: true,
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <SoundProvider>
            <NotificationProvider>
              <BlockUserProvider>
                <TrashProvider>
                    {children}
                </TrashProvider>
              </BlockUserProvider>
              <Toaster />
            </NotificationProvider>
          </SoundProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
