
// src/context/music-player-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player/lazy';
import { useToast } from '@/hooks/use-toast';

export interface SavedSong {
  id: string;
  name: string;
  url: string;
}

interface MusicPlayerContextProps {
  url: string;
  isPlaying: boolean;
  savedSongs: SavedSong[];
  setUrl: (url: string) => void;
  togglePlay: () => void;
  addSong: (name: string, url: string) => void;
  removeSong: (id: string) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextProps | undefined>(undefined);

const SAVED_SONGS_STORAGE_KEY = 'echo_saved_songs';
const LAST_PLAYED_URL_KEY = 'echo_last_played_url';

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);

  useEffect(() => {
    setIsClient(true);
    try {
        const storedSongs = localStorage.getItem(SAVED_SONGS_STORAGE_KEY);
        if (storedSongs) {
            setSavedSongs(JSON.parse(storedSongs));
        }
        const lastUrl = localStorage.getItem(LAST_PLAYED_URL_KEY);
        if (lastUrl) {
            setUrl(lastUrl);
        }
    } catch (error) {
        console.error("Failed to load music player state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem(SAVED_SONGS_STORAGE_KEY, JSON.stringify(savedSongs));
            if (url) {
                localStorage.setItem(LAST_PLAYED_URL_KEY, url);
            }
        } catch (error) {
            console.error("Failed to save music player state to localStorage", error);
        }
    }
  }, [savedSongs, url, isClient]);

  const togglePlay = useCallback(() => {
    if (!url) {
      toast({
        title: "No Music Selected",
        description: "Please provide a URL or select a local file to play.",
        variant: "destructive",
      });
      return;
    }
    setIsPlaying(prev => !prev);
  }, [url, toast]);

  const handleSetUrl = (newUrl: string) => {
    setUrl(newUrl);
    setIsPlaying(true); // Auto-play new URL
  };

  const addSong = useCallback((name: string, url: string) => {
    if (!name.trim() || !url.trim()) {
        toast({ title: 'Invalid Input', description: 'Song name and URL cannot be empty.', variant: 'destructive'});
        return;
    }
    const newSong: SavedSong = { id: `song-${Date.now()}`, name, url };
    setSavedSongs(prev => [...prev, newSong]);
    toast({ title: 'Song Added', description: `"${name}" has been added to your playlist.` });
  }, [toast]);

  const removeSong = useCallback((id: string) => {
    setSavedSongs(prev => {
        const songToRemove = prev.find(song => song.id === id);
        // If the song being removed is the currently playing one, stop playback.
        if (songToRemove && songToRemove.url === url) {
            setUrl('');
            setIsPlaying(false);
        }
        return prev.filter(song => song.id !== id);
    });
    toast({ title: 'Song Removed', description: 'The song has been removed from your playlist.', variant: 'destructive'});
  }, [url, toast]);

  return (
    <MusicPlayerContext.Provider value={{ url, isPlaying, setUrl: handleSetUrl, togglePlay, savedSongs, addSong, removeSong }}>
      {children}
      {isClient && (
        <div className="hidden">
          <ReactPlayer
            url={url}
            playing={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e, data) => {
              if (url && data?.type !== 'metadata') { // Ignore metadata errors
                console.error('ReactPlayer Error:', e, data);
                setIsPlaying(false);
                toast({
                  title: "Playback Error",
                  description: "The provided URL or file could not be played.",
                  variant: 'destructive'
                });
              }
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
