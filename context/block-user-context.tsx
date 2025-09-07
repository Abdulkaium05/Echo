// src/context/block-user-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

interface BlockUserContextProps {
  blockedUserIds: string[];
  addBlockedUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
}

const BlockUserContext = createContext<BlockUserContextProps | undefined>(undefined);

const BLOCKED_USERS_STORAGE_KEY = 'echo_blocked_users';

export const BlockUserProvider = ({ children }: { children: ReactNode }) => {
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedBlockedUsers = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      if (storedBlockedUsers) {
        setBlockedUserIds(JSON.parse(storedBlockedUsers));
      }
    } catch (error) {
      console.error("Failed to load blocked users from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blockedUserIds));
        } catch (error) {
            console.error("Failed to save blocked users to localStorage", error);
        }
    }
  }, [blockedUserIds, isLoaded]);

  const addBlockedUser = useCallback((userId: string) => {
    setBlockedUserIds(prev => {
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });
  }, []);
  
  const unblockUser = useCallback((userId: string) => {
    setBlockedUserIds(prev => prev.filter(id => id !== userId));
  }, []);

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUserIds.includes(userId);
  }, [blockedUserIds]);

  const value = {
    blockedUserIds,
    addBlockedUser,
    unblockUser,
    isUserBlocked,
  };

  return (
    <BlockUserContext.Provider value={value}>
      {children}
    </BlockUserContext.Provider>
  );
};

export const useBlockUser = () => {
  const context = useContext(BlockUserContext);
  if (context === undefined) {
    throw new Error('useBlockUser must be used within a BlockUserProvider');
  }
  return context;
};
