
// src/context/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  type User 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp, updateDoc, deleteField } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { BadgeType } from '@/app/(app)/layout';
import { getUserProfile, updateUserProfile as updateUserInFirestore, sendWelcomeMessage } from '@/services/firestore';
import { initializeFirebase } from '@/firebase'; // Corrected import
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { UserProfile } from '@/types/user';

const { firebaseApp, auth: firebaseAuth, firestore: firebaseFirestore, storage: firebaseStorage } = initializeFirebase();

const USER_PROFILE_CACHE_KEY = 'echo_user_profile_cache';

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
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string, pass: string) => Promise<{ success: boolean; message: string; user: User | null, userProfile: UserProfile | null }>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<User | null>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({ gifterProfile: null, giftedBadge: null });
  const [pointsGiftInfo, setPointsGiftInfo] = useState<PointsGiftInfo>({ gifterProfile: null, giftedPointsAmount: null });

  const { toast } = useToast();
  
  // Effect to load user profile from cache on initial mount
  useEffect(() => {
    try {
        const cachedProfile = localStorage.getItem(USER_PROFILE_CACHE_KEY);
        if (cachedProfile) {
            const profile = JSON.parse(cachedProfile);
            // We set the profile, but keep loading states true until auth is confirmed.
            setUserProfile(profile);
        }
    } catch (e) {
        console.error("Failed to load user profile from cache", e);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser?.uid) {
        throw new Error("User not authenticated.");
      }
      await updateUserInFirestore(currentUser.uid, data);
      
      const newProfile = (prev: UserProfile | null) => (prev ? { ...prev, ...data } : null);
      setUserProfile(newProfile);
      
      // Update cache
      if (newProfile) {
          try {
              const profileToCache = newProfile(userProfile);
              if (profileToCache) {
                // We need to handle non-serializable fields like Timestamps before caching
                const serializableProfile = JSON.parse(JSON.stringify({
                    ...profileToCache,
                    lastSeen: profileToCache.lastSeen?.seconds,
                    createdAt: profileToCache.createdAt?.seconds,
                }));
                localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(serializableProfile));
              }
          } catch(e) {
              console.error("Failed to cache updated user profile", e);
          }
      }
    },
    [userProfile]
  );
  
    const processLogin = useCallback(async (firebaseUser: User) => {
    try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
            console.error('User profile missing for UID:', firebaseUser.uid);
            setUserProfile(null);
            localStorage.removeItem(USER_PROFILE_CACHE_KEY);
            return;
        }

        let updatedProfileData: Partial<UserProfile> = {};
        let needsServerUpdate = false;
        
        let localProfile = { ...profile };

        // VIP Expiry check
        if (localProfile.isVIP && localProfile.vipExpiryTimestamp && localProfile.vipExpiryTimestamp < Date.now()) {
            updatedProfileData = {
                ...updatedProfileData,
                isVIP: false,
                vipPack: deleteField(),
                vipExpiryTimestamp: deleteField(),
            };
            needsServerUpdate = true;
        }

        if (localProfile.hasNewGift && localProfile.giftedByUid && localProfile.lastGiftedBadge) {
          const gifterProfile = await getUserProfile(localProfile.giftedByUid);
          if (gifterProfile) {
            setGiftInfo({ gifterProfile, giftedBadge: localProfile.lastGiftedBadge });
          }
          updatedProfileData = { 
              ...updatedProfileData, 
              hasNewGift: false, 
              giftedByUid: deleteField(), 
              lastGiftedBadge: deleteField() 
          };
          needsServerUpdate = true;
        }

        if (localProfile.hasNewPointsGift && localProfile.pointsGifterUid && localProfile.lastGiftedPointsAmount) {
            const gifterProfile = await getUserProfile(localProfile.pointsGifterUid);
            if (gifterProfile) {
              setPointsGiftInfo({ gifterProfile, giftedPointsAmount: localProfile.lastGiftedPointsAmount });
            }
            updatedProfileData = { 
                ...updatedProfileData, 
                hasNewPointsGift: false, 
                pointsGifterUid: deleteField(), 
                lastGiftedPointsAmount: deleteField() 
            };
            needsServerUpdate = true;
        }

        // Badge expiry
        if (localProfile.badgeExpiry) {
            const now = Date.now();
            const expiryMap = { ...localProfile.badgeExpiry };
            let expiryChanged = false;
            for (const key in expiryMap) {
                const type = key as BadgeType;
                const expiry = expiryMap[type];
                if (expiry && expiry < now) { // Only check if expiry is a number
                    delete expiryMap[type];
                    const stateKey = 'is' + type.replace(/_([a-z])/g, (_, g) => g.toUpperCase()).replace(/^\w/, c => c.toUpperCase());
                    updatedProfileData[stateKey as keyof UserProfile] = false;
                    expiryChanged = true;
                }
            }
            if (expiryChanged) {
              updatedProfileData.badgeExpiry = expiryMap;
              needsServerUpdate = true;
            }
        }
        
        localProfile = { ...localProfile, ...updatedProfileData, lastSeen: Timestamp.now() };
        setUserProfile(localProfile);
        
        try {
            // Firestore Timestamps are not directly serializable for localStorage
            const serializableProfile = JSON.parse(JSON.stringify({
                ...localProfile,
                lastSeen: localProfile.lastSeen?.seconds,
                createdAt: localProfile.createdAt?.seconds,
            }));
            localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(serializableProfile));
        } catch(e) {
            console.error("Failed to cache user profile", e);
        }

        if (needsServerUpdate) {
            await updateUserInFirestore(firebaseUser.uid, updatedProfileData);
        }

    } catch (error) {
        console.error("Error during login processing:", error);
        setUserProfile(null);
        localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    }
  }, [setGiftInfo, setPointsGiftInfo]);

  useEffect(() => {
    if (!firebaseAuth) {
      console.warn("AuthProvider: Firebase is not configured.");
      setLoading(false);
      setIsUserProfileLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setLoading(true);
      // We set profile loading true here, even if we have a cache, 
      // because we always want to fetch fresh data.
      setIsUserProfileLoading(true); 
      setUser(firebaseUser);

      if (firebaseUser) {
        await processLogin(firebaseUser);
      } else {
        setUserProfile(null);
        localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      }
      
      // Finish loading after all checks are done.
      setIsUserProfileLoading(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [processLogin]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (!firebaseAuth) return { success: false, message: "Firebase not configured." };
    setLoading(true);
    setIsUserProfileLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, pass);
      // onAuthStateChanged handles the rest
      return { success: true, message: 'Login successful!' };
    } catch (err: any) {
      setLoading(false);
      setIsUserProfileLoading(false);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const signup = async (email: string, pass: string): Promise<{ success: boolean; message: string; user: User | null; userProfile: UserProfile | null }> => {
    if (!firebaseAuth) return { success: false, message: "Firebase not configured.", user: null, userProfile: null };
    setLoading(true);
    setIsUserProfileLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      const newUser = userCredential.user;
      
      await sendEmailVerification(newUser);

      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) || 'newuser';
      
      const profile: UserProfile = {
        uid: newUser.uid,
        displayUid: Math.floor(10000000 + Math.random() * 90000000).toString(),
        name: username,
        email,
        avatarUrl: 'default-avatar',
        points: 0,
        starGems: 0,
        isVIP: false,
        isVerified: false,
        isCreator: false,
        isMemeCreator: false,
        isBetaTester: false,
        createdAt: serverTimestamp() as Timestamp,
        lastSeen: serverTimestamp() as Timestamp,
        blockedUsers: [],
        badgeOrder: [],
        badgeExpiry: {},
        chatColorPreferences: {},
        hasCompletedOnboarding: false,
      };
      
      await setDoc(doc(firebaseFirestore, 'users', newUser.uid), profile);
      await sendWelcomeMessage(newUser.uid);

      setUser(newUser);
      setUserProfile(profile);

      return { success: true, message: 'Signup complete! Check your email for verification.', user: newUser, userProfile: profile };
      
    } catch (err: any) {
      return { success: false, message: err.message || 'Signup failed', user: null, userProfile: null };
    } finally {
      setIsUserProfileLoading(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    if (user && firebaseAuth) {
      await updateUserInFirestore(user.uid, { lastSeen: serverTimestamp() as Timestamp });
      await signOut(firebaseAuth);
    }
    // onAuthStateChanged will handle setting user/profile to null
  };
  
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!firebaseAuth) return { success: false, message: "Firebase not configured." };
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { success: true, message: `Password reset email sent to ${email}.` };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send password reset email.' };
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) throw new Error("Not logged in.");
    if (currentUser.emailVerified) throw new Error("Email is already verified.");
    await sendEmailVerification(currentUser);
  };

  const reloadUser = async (): Promise<User | null> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return null;
    
    await reload(currentUser);
    const refreshedUser = firebaseAuth.currentUser;
    
    if (refreshedUser) {
      setUser(refreshedUser);
    }
    return refreshedUser;
  };

  const value: AuthContextProps = {
    user,
    userProfile,
    loading,
    isUserProfileLoading,
    giftInfo,
    setGiftInfo,
    pointsGiftInfo,
    setPointsGiftInfo,
    login,
    signup,
    logout,
    sendPasswordReset,
    sendVerificationEmail,
    reloadUser,
    updateUserProfile,
    auth: firebaseAuth,
    firestore: firebaseFirestore,
    storage: firebaseStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
