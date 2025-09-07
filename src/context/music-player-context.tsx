
// src/context/music-player-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player/lazy';
import { useToast } from '@/hooks/use-toast';

interface MusicPlayerContextProps {
  url: string;
  isPlaying: boolean;
  isReady: boolean;
  setUrl: (url: string) => void;
  togglePlay: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextProps | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!url) {
      toast({
        title: "No Music Selected",
        description: "Please provide a URL or select a local file to play.",
        variant: "destructive",
      });
      return;
    }
    if (!isReady) {
        toast({
            title: "Player Not Ready",
            description: "The music player is still loading. Please wait a moment.",
        });
        return;
    }
    setIsPlaying(prev => !prev);
  }, [url, isReady, toast]);

  const handleSetUrl = (newUrl: string) => {
    setIsReady(false); // Reset ready state on new URL
    setUrl(newUrl);
    setIsPlaying(true); // Auto-play new URL
  };

  return (
    <MusicPlayerContext.Provider value={{ url, isPlaying, isReady, setUrl: handleSetUrl, togglePlay }}>
      {children}
      {isClient && (
        <div className="hidden">
          <ReactPlayer
            url={url}
            playing={isPlaying}
            onReady={() => setIsReady(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('ReactPlayer Error:', e);
              setIsPlaying(false);
              toast({
                title: "Playback Error",
                description: "The provided URL or file could not be played.",
                variant: 'destructive'
              });
            }}
            width="0"
            height="0"
            config={{
                file: {
                    forceAudio: true,
                }
            }}
          />
        </div>
      )}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
