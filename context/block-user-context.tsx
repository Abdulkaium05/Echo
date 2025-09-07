
// src/context/block-user-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';

interface BlockUserContextProps {
  blockedUserIds: string[];
  addBlockedUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
}

const BlockUserContext = createContext<BlockUserContextProps | undefined>(undefined);

const BLOCKED_USERS_STORAGE_KEY = 'echo_blocked_users';

export const BlockUserProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile, updateMockUserProfile } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage initially
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
    // Sync with userProfile when it loads
    if (userProfile && isLoaded) {
      // Prioritize userProfile.blockedUsers as the source of truth if it exists
      const profileBlockedUsers = userProfile.blockedUsers || [];
      setBlockedUserIds(profileBlockedUsers);
      localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(profileBlockedUsers));
    }
  }, [userProfile, isLoaded]);

  useEffect(() => {
    // Save to local storage whenever the list changes (and is loaded)
    if (isLoaded) {
        try {
            localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blockedUserIds));
        } catch (error) {
            console.error("Failed to save blocked users to localStorage", error);
        }
    }
  }, [blockedUserIds, isLoaded]);

  const addBlockedUser = useCallback((userId: string) => {
    if (!user || !userProfile) return;
    
    const newBlockedList = Array.from(new Set([...(userProfile.blockedUsers || []), userId]));

    updateMockUserProfile(user.uid, { blockedUsers: newBlockedList });

    setBlockedUserIds(newBlockedList);
  }, [user, userProfile, updateMockUserProfile]);
  
  const unblockUser = useCallback((userId: string) => {
    if (!user || !userProfile) return;

    const newBlockedList = (userProfile.blockedUsers || []).filter(id => id !== userId);
    
    updateMockUserProfile(user.uid, { blockedUsers: newBlockedList });

    setBlockedUserIds(newBlockedList);
  }, [user, userProfile, updateMockUserProfile]);

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
