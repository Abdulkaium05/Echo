// src/context/trash-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { ChatItemProps } from '@/components/chat/chat-item';
import { useToast } from '@/hooks/use-toast';

interface TrashedChatInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  contactUserId: string;
}

interface TrashContextProps {
  trashedChats: TrashedChatInfo[];
  trashChat: (chat: ChatItemProps) => void;
  restoreChat: (chatId: string) => void;
  isChatTrashed: (chatId: string) => boolean;
}

const TrashContext = createContext<TrashContextProps | undefined>(undefined);

const TRASH_STORAGE_KEY = 'echo_trashed_chats';

export const TrashProvider = ({ children }: { children: ReactNode }) => {
  const [trashedChats, setTrashedChats] = useState<TrashedChatInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
      if (storedTrash) {
        setTrashedChats(JSON.parse(storedTrash));
      }
    } catch (error) {
      console.error("Failed to load trashed chats from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashedChats));
        } catch (error) {
            console.error("Failed to save trashed chats to localStorage", error);
        }
    }
  }, [trashedChats, isLoaded]);

  const trashChat = useCallback((chatToTrash: ChatItemProps) => {
    setTrashedChats(prev => {
      if (prev.some(c => c.id === chatToTrash.id)) return prev;
      const newTrashedItem: TrashedChatInfo = {
        id: chatToTrash.id,
        name: chatToTrash.name,
        avatarUrl: chatToTrash.avatarUrl,
        contactUserId: chatToTrash.contactUserId,
      };
      return [...prev, newTrashedItem];
    });
  }, []);
  
  const restoreChat = useCallback((chatId: string) => {
    setTrashedChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  const isChatTrashed = useCallback((chatId: string) => {
    return trashedChats.some(c => c.id === chatId);
  }, [trashedChats]);

  const value = {
    trashedChats,
    trashChat,
    restoreChat,
    isChatTrashed,
  };

  return (
    <TrashContext.Provider value={value}>
      {children}
    </TrashContext.Provider>
  );
};

export const useTrash = () => {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error('useTrash must be used within a TrashProvider');
  }
  return context;
};
