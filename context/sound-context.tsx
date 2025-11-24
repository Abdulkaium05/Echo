// src/context/sound-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';

interface SoundContextProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (src: string | null, loop?: boolean) => void;
}

const SoundContext = createContext<SoundContextProps | undefined>(undefined);

const SOUND_ENABLED_KEY = 'echo_sound_enabled';

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(SOUND_ENABLED_KEY);
      if (storedValue !== null) {
        setSoundEnabled(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error("Failed to load sound settings from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(soundEnabled));
        } catch (error) {
            console.error("Failed to save sound settings to localStorage", error);
        }
    }
  }, [soundEnabled, isLoaded]);

  const playSound = useCallback((src: string | null, loop: boolean = false) => {
    // Stop any currently playing sound
    if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
    }

    if (soundEnabled && src && typeof Audio !== 'undefined') {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.play().catch(error => {
            console.warn(`Sound playback failed for ${src}. Error:`, error);
        });
        activeAudioRef.current = audio;
    }
  }, [soundEnabled]);

  const value = {
    soundEnabled,
    setSoundEnabled,
    playSound,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
