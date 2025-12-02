// src/context/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth'; // Firebase User type
import type { Timestamp } from 'firebase/firestore';
import { 
    findUserByUid,
    updateUserProfile,
    ensureChatWithBotExists,
    initiateEmailSignUp,
    initiateEmailSignIn,
    logout as firebaseLogout,
} from '@/services/firestore'; 
import type { UserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import type { BadgeType } from '@/app/(app)/layout';
import { useFirebase } from '@/firebase';

export interface GiftInfo {
    gifterProfile: UserProfile | null;
    giftedBadge: BadgeType | null;
}

export interface PointsGiftInfo {
    gifterProfile: UserProfile | null;
    giftedPointsAmount: number | null;
}

interface AuthContextProps {
  user: User | null; 
  userProfile: UserProfile | null; 
  loading: boolean; 
  isUserProfileLoading: boolean;
  giftInfo: GiftInfo;
  setGiftInfo: React.Dispatch<React.SetStateAction<GiftInfo>>;
  pointsGiftInfo: PointsGiftInfo;
  setPointsGiftInfo: React.Dispatch<React.SetStateAction<PointsGiftInfo>>;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  signup: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  logout: () => Promise<void>;
  updateMockUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const generateDisplayUid = (username: string): string => {
    let sanitized = username.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    sanitized = sanitized.replace(/\s+/g, ['.', '_'][Math.floor(Math.random() * 2)]);
    sanitized = sanitized.substring(0, 15);
    const randomNumber = Math.floor(Math.random() * 100);
    const finalId = `${sanitized}${randomNumber.toString().padStart(2, '0')}`;
    if (!finalId || finalId.length < 3) {
        return `user${Date.now().toString().slice(-5)}`;
    }
    return finalId;
};

const DefaultAvatar = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" className={className} {...props}>
        <path d="M50,5A45,45,0,1,1,5,50,45,45,0,0,1,50,5M50,0a50,50,0,1,0,50,50A50,50,0,0,0,50,0Z" fill="hsl(var(--border))"/>
        <path d="M50,15a20,20,0,1,1-20,20,20,20,0,0,1,20-20m0-5a25,25,0,1,0,25,25,25,25,0,0,0-25-25Z" fill="hsl(var(--muted))"/>
        <path d="M50,60A35,35,0,0,1,15,95a45,45,0,0,1,70,0A35,35,0,0,1,50,60m0-5a40,40,0,0,0,40,40,50,50,0,0,0-80,0,40,40,0,0,0,40-40Z" fill="hsl(var(--muted))"/>
    </svg>
);

const svgToDataURI = (svg: React.ReactElement): string => {
    const svgString = new XMLSerializer().serializeToString(
      // @ts-ignore
      React.createElement(svg.type, { ...svg.props, xmlns: 'http://www.w3.org/2000/svg' })
    );
    return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, user: authUser, isUserLoading: authIsLoading, userError: authError } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({ gifterProfile: null, giftedBadge: null });
  const [pointsGiftInfo, setPointsGiftInfo] = useState<PointsGiftInfo>({ gifterProfile: null, giftedPointsAmount: null });
  const { toast } = useToast();

  const updateMockUserProfile = useCallback(async (uid: string, data: Partial<UserProfile>) => {
    await updateUserProfile(uid, data);
    if (uid === authUser?.uid) {
        setUserProfile(prev => prev ? { ...prev, ...data } : null);
    }
  }, [authUser?.uid]);
  
  const processLogin = useCallback(async (profile: UserProfile): Promise<UserProfile> => {
    let updatedProfile = { ...profile };
    let profileWasModified = false;

    if (updatedProfile.hasNewGift && updatedProfile.giftedByUid && updatedProfile.lastGiftedBadge) {
        const gifterProfile = await findUserByUid(updatedProfile.giftedByUid);
        if (gifterProfile) {
            setGiftInfo({ gifterProfile, giftedBadge: updatedProfile.lastGiftedBadge as BadgeType });
        }
        delete updatedProfile.hasNewGift;
        delete updatedProfile.giftedByUid;
        delete updatedProfile.lastGiftedBadge;
        profileWasModified = true;
    }
    
    if (updatedProfile.hasNewPointsGift && updatedProfile.pointsGifterUid && updatedProfile.lastGiftedPointsAmount) {
        const gifterProfile = await findUserByUid(updatedProfile.pointsGifterUid);
        if (gifterProfile) {
            setPointsGiftInfo({ gifterProfile, giftedPointsAmount: updatedProfile.lastGiftedPointsAmount });
        }
        delete updatedProfile.hasNewPointsGift;
        delete updatedProfile.pointsGifterUid;
        delete updatedProfile.lastGiftedPointsAmount;
        profileWasModified = true;
    }

    if (updatedProfile.badgeExpiry) {
        const now = Date.now();
        const badgeExpiry = { ...updatedProfile.badgeExpiry };
        let expiredBadges: { name: string, type: BadgeType }[] = [];

        for (const key in badgeExpiry) {
            const badgeType = key as BadgeType;
            if (badgeExpiry[badgeType]! < now) {
                const badgeKey = `is${badgeType.charAt(0).toUpperCase() + badgeType.slice(1).replace(/_([a-z])/g, g => g[1].toUpperCase())}` as keyof UserProfile;
                (updatedProfile as any)[badgeKey] = false;
                delete badgeExpiry[badgeType];
                profileWasModified = true;
                if(badgeType === 'meme_creator') expiredBadges.push({ name: 'Meme Creator', type: 'meme_creator'});
                if(badgeType === 'beta_tester') expiredBadges.push({ name: 'Beta Tester', type: 'beta_tester'});
                if(badgeType === 'vip') expiredBadges.push({ name: 'VIP', type: 'vip'});
            }
        }
        updatedProfile.badgeExpiry = badgeExpiry;

        if (expiredBadges.length > 0) {
          setTimeout(() => {
            expiredBadges.forEach(badge => {
              toast({ title: 'Trial Badge Expired', description: `Your ${badge.name} trial badge has expired.`, variant: 'destructive' });
            });
          }, 1000);
        }
    }

    if (profileWasModified) {
        await updateUserProfile(updatedProfile.uid, updatedProfile);
    }
    
    return updatedProfile;
  }, [toast]);

  useEffect(() => {
    setIsUserProfileLoading(true);
    if (!authUser) {
      setUserProfile(null);
      setIsUserProfileLoading(false);
      return;
    }
    if(authError) {
        console.error("Firebase Auth Error:", authError);
        setUserProfile(null);
        setIsUserProfileLoading(false);
        return;
    }

    findUserByUid(authUser.uid)
      .then(async (profile) => {
        if (profile) {
            const processedProfile = await processLogin(profile);
            setUserProfile(processedProfile);
            updateUserProfile(authUser.uid, { lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0 } as unknown as Timestamp });
        } else {
            console.warn(`No user profile found for UID: ${authUser.uid}. This might be a new user.`);
            setUserProfile(null);
        }
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      })
      .finally(() => {
        setIsUserProfileLoading(false);
      });
  }, [authUser, authError, processLogin]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; }> => {
    try {
      await initiateEmailSignIn(auth, email, pass);
      return { success: true, message: "Login successful." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
  }, [auth]);

  const signup = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const userCredential = await initiateEmailSignUp(auth, email, pass);
        const newUser = userCredential.user;
        const defaultUsername = email.split('@')[0];
        const displayUid = generateDisplayUid(defaultUsername);
        
        const defaultAvatarSvg = <DefaultAvatar />;
        const defaultAvatarDataUri = svgToDataURI(defaultAvatarSvg);
        
        const newUserProfile: UserProfile = {
            uid: newUser.uid,
            displayUid: displayUid,
            name: defaultUsername,
            email: email.toLowerCase(),
            avatarUrl: defaultAvatarDataUri,
            points: 0,
            isVIP: false,
            createdAt: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as Timestamp,
            isVerified: false,
            isCreator: false,
            isMemeCreator: false,
            isBetaTester: false,
            lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as Timestamp,
        };
        await updateUserProfile(newUser.uid, newUserProfile);
        await ensureChatWithBotExists(newUser.uid);
        setUserProfile(newUserProfile);
        return { success: true, message: "Signup successful!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (userProfile) {
        await updateUserProfile(userProfile.uid, { lastSeen: { seconds: Math.floor(Date.now()/1000) - (5 * 60), nanoseconds: 0 } as unknown as Timestamp });
    }
    await firebaseLogout(auth);
    setUserProfile(null);
  }, [auth, userProfile]);

  const value = { 
      user: authUser, 
      userProfile, 
      loading: authIsLoading, 
      isUserProfileLoading, 
      giftInfo, setGiftInfo, 
      pointsGiftInfo, setPointsGiftInfo, 
      login, signup, logout, 
      updateMockUserProfile 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
