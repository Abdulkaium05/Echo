
// src/context/vip-context.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

interface VIPContextProps {
  isVIP: boolean; // Does the user have a purchased VIP plan (and thus the badge)?
  hasVipAccess: boolean; // Does the user have access to VIP features?
  vipPack?: string;
  setVIPStatus: (status: boolean, pack?: string) => void;
}

const VIPContext = createContext<VIPContextProps | undefined>(undefined);

export const VIPProvider = ({ children }: { children: ReactNode }) => {
  const { userProfile, isUserProfileLoading } = useAuth();
  
  const [isVIP, setIsVIP] = useState(false); // For the badge
  const [hasVipAccess, setHasVipAccess] = useState(false); // For features
  const [vipPack, setVipPack] = useState<string | undefined>();

  useEffect(() => {
    if (isUserProfileLoading) {
      console.log("VIPProvider: Waiting for user profile to load...");
      return;
    }

    if (userProfile) {
      // Determines if the user has access to VIP features
      const currentVipAccess = userProfile.isVIP || userProfile.isVerified || userProfile.isCreator || userProfile.isDevTeam;
      setHasVipAccess(currentVipAccess);
      
      // Determines if the user has a purchased VIP plan (for the badge)
      let currentVipBadgeStatus = userProfile.isVIP ?? false;
      let currentVIPPack = userProfile.vipPack;
      
      // Handle expiry for non-DevTeam users
      if (!userProfile.isDevTeam && currentVipBadgeStatus && userProfile.vipExpiryTimestamp && Date.now() > userProfile.vipExpiryTimestamp) {
        console.log("VIPProvider: VIP subscription expired. Reverting badge status.");
        currentVipBadgeStatus = false;
        currentVIPPack = undefined;
      }
      
      console.log(`VIPProvider: Initializing VIP Access: ${currentVipAccess}, Badge: ${currentVipBadgeStatus}, Pack: ${currentVIPPack}`);
      setIsVIP(currentVipBadgeStatus);
      setVipPack(currentVIPPack);

    } else {
      console.log("VIPProvider: No user profile found, setting all VIP states to false.");
      setIsVIP(false);
      setHasVipAccess(false);
      setVipPack(undefined);
    }
  }, [userProfile, isUserProfileLoading]);


  const setVIPStatus = useCallback((status: boolean, pack?: string) => {
    let actualBadgeStatus = status;
    
    // Recalculate access based on profile roles + new badge status
    const currentVipAccess = status || userProfile?.isVerified || userProfile?.isCreator || userProfile?.isDevTeam || false;
    setHasVipAccess(currentVipAccess);
    
    // Handle expiry for badge status
    if (status && userProfile?.vipExpiryTimestamp && Date.now() > userProfile.vipExpiryTimestamp) {
        console.warn("VIPProvider (setVIPStatus): Attempting to set VIP badge to true, but subscription is expired. Setting to false.");
        actualBadgeStatus = false;
    }

    console.log(`VIPProvider (setVIPStatus): Setting VIP Badge to ${actualBadgeStatus}, Pack: ${actualBadgeStatus ? pack : undefined}. VIP Access is ${currentVipAccess}.`);
    setIsVIP(actualBadgeStatus);
    setVipPack(actualBadgeStatus ? pack : undefined);

  }, [userProfile]);

   const value = { isVIP, hasVipAccess, vipPack, setVIPStatus };

  return (
    <VIPContext.Provider value={value}>
      {children}
    </VIPContext.Provider>
  );
};

export const useVIP = () => {
  const context = useContext(VIPContext);
  if (context === undefined) {
    throw new Error('useVIP must be used within a VIPProvider');
  }
  return context;
};
