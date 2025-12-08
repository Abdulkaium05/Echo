
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

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser?.uid) {
        throw new Error("User not authenticated.");
      }
      await updateUserInFirestore(currentUser.uid, data);
      setUserProfile(prev => (prev ? { ...prev, ...data } : null));
    },
    []
  );
  
  const processLogin = useCallback(async (firebaseUser: User) => {
    setIsUserProfileLoading(true);
    try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
            console.error('User profile missing for UID:', firebaseUser.uid);
            setUserProfile(null);
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

        if (needsServerUpdate) {
            await updateUserInFirestore(firebaseUser.uid, updatedProfileData);
        }

    } catch (error) {
        console.error("Error during login processing:", error);
        setUserProfile(null);
    } finally {
        setIsUserProfileLoading(false);
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
      setUser(firebaseUser);

      if (firebaseUser) {
        await processLogin(firebaseUser);
      } else {
        setUserProfile(null);
        setIsUserProfileLoading(false);
      }
      
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
        fcmTokens: [],
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
