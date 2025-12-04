
// src/context/block-user-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { updateUserProfile } from '@/services/firestore';

interface BlockUserContextProps {
  blockedUserIds: string[];
  addBlockedUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
}

const BlockUserContext = createContext<BlockUserContextProps | undefined>(undefined);

export const BlockUserProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile, updateUserProfile: authUpdateProfile } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sync with userProfile when it loads
    if (userProfile && !isLoaded) {
      const profileBlockedUsers = userProfile.blockedUsers || [];
      setBlockedUserIds(profileBlockedUsers);
      setIsLoaded(true);
    }
  }, [userProfile, isLoaded]);

  const addBlockedUser = useCallback(async (userId: string) => {
    if (!user) return;
    const newBlockedList = Array.from(new Set([...blockedUserIds, userId]));
    await updateUserProfile(user.uid, { blockedUsers: newBlockedList });
    setBlockedUserIds(newBlockedList);
    // Also update the local auth context profile
    authUpdateProfile({ blockedUsers: newBlockedList });
  }, [user, blockedUserIds, authUpdateProfile]);
  
  const unblockUser = useCallback(async (userId: string) => {
    if (!user) return;
    const newBlockedList = blockedUserIds.filter(id => id !== userId);
    await updateUserProfile(user.uid, { blockedUsers: newBlockedList });
    setBlockedUserIds(newBlockedList);
    // Also update the local auth context profile
    authUpdateProfile({ blockedUsers: newBlockedList });
  }, [user, blockedUserIds, authUpdateProfile]);

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

    