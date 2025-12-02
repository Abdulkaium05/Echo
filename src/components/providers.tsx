// src/components/providers.tsx
'use client';

import { AuthProvider } from '@/context/auth-context';
import { BlockUserProvider } from '@/context/block-user-context';
import { MusicPlayerProvider } from '@/context/music-player-context';
import { SoundProvider } from '@/context/sound-context';
import { TrashProvider } from '@/context/trash-context';
import { VIPProvider } from '@/context/vip-context';
import { FirebaseClientProvider } from '@/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
        <AuthProvider>
          <SoundProvider>
              <BlockUserProvider>
                <TrashProvider>
                  <VIPProvider>
                    <MusicPlayerProvider>
                      {children}
                    </MusicPlayerProvider>
                  </VIPProvider>
                </TrashProvider>
              </BlockUserProvider>
          </SoundProvider>
        </AuthProvider>
    </FirebaseClientProvider>
  );
}
