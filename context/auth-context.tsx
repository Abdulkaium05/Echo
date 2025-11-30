// src/context/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  type User 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Timestamp, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { BadgeType } from '@/app/(app)/layout';
import { getUserProfile, updateUserProfile as updateUserInFirestore, sendWelcomeMessage } from '@/services/firestore';
import { auth as firebaseAuth, firestore as firebaseFirestore, storage as firebaseStorage } from '@/lib/firebase/config';
import type { UserProfile } from '@/types/user';

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
  updateMockUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  auth: typeof firebaseAuth;
  firestore: typeof firebaseFirestore;
  storage: typeof firebaseStorage;
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

  // -------------------------------
  // Update profile helper
  // -------------------------------
  const updateMockUserProfile = useCallback(
    async (uid: string, data: Partial<UserProfile>) => {
      if (!firebaseFirestore) return;
      await updateUserInFirestore(uid, data);
      if (user?.uid === uid) setUserProfile(prev => (prev ? { ...prev, ...data } : null));
    },
    [user?.uid]
  );

  // -------------------------------
  // Process login
  // -------------------------------
  const processLogin = useCallback(async (firebaseUser: User) => {
    setIsUserProfileLoading(true);
    try {
        if (!firebaseFirestore) {
            console.error("Firestore not initialized, cannot process login.");
            setIsUserProfileLoading(false);
            return;
        }

        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
            console.error('User profile missing for UID:', firebaseUser.uid);
            setUserProfile(null); // Explicitly set to null
            setIsUserProfileLoading(false);
            return;
        }

        let updatedProfile: Partial<UserProfile> = {};
        let changed = false;

        // Handle gifts
        if (profile.hasNewGift && profile.giftedByUid && profile.lastGiftedBadge) {
            const gifterProfile = await getUserProfile(profile.giftedByUid);
            if (gifterProfile) setGiftInfo({ gifterProfile, giftedBadge: profile.lastGiftedBadge as BadgeType });
            updatedProfile = { ...updatedProfile, hasNewGift: false, giftedByUid: null, lastGiftedBadge: null };
            changed = true;
        }

        if (profile.hasNewPointsGift && profile.pointsGifterUid && profile.lastGiftedPointsAmount) {
            const gifterProfile = await getUserProfile(profile.pointsGifterUid);
            if (gifterProfile) setPointsGiftInfo({ gifterProfile, giftedPointsAmount: profile.lastGiftedPointsAmount });
            updatedProfile = { ...updatedProfile, hasNewPointsGift: false, pointsGifterUid: null, lastGiftedPointsAmount: null };
            changed = true;
        }

        // Badge expiry
        if (profile.badgeExpiry) {
            const now = Date.now();
            const expiryMap = { ...profile.badgeExpiry };
            let expiryChanged = false;
            for (const key in expiryMap) {
                const type = key as BadgeType;
                if (expiryMap[type]! < now) {
                    delete expiryMap[type];
                    const stateKey = 'is' + type.replace(/_([a-z])/g, (_, g) => g.toUpperCase()).replace(/^\w/, c => c.toUpperCase());
                    updatedProfile[stateKey as keyof UserProfile] = false;
                    expiryChanged = true;
                }
            }
            if (expiryChanged) {
              updatedProfile.badgeExpiry = expiryMap;
              changed = true;
            }
        }

        if (changed) {
            await updateUserInFirestore(firebaseUser.uid, updatedProfile);
            // Re-fetch the profile to ensure UI consistency after updates
            const finalProfile = await getUserProfile(firebaseUser.uid);
            setUserProfile(finalProfile);
        } else {
            setUserProfile(profile);
        }

        await updateUserInFirestore(firebaseUser.uid, { lastSeen: serverTimestamp() });
    } catch (error) {
        console.error("Error during login processing:", error);
        setUserProfile(null);
    } finally {
        setIsUserProfileLoading(false);
    }
}, []);


  // -------------------------------
  // Auth state observer
  // -------------------------------
  useEffect(() => {
    if (!firebaseAuth) {
        setLoading(false);
        setIsUserProfileLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async firebaseUser => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await processLogin(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsUserProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [processLogin]);

  // -------------------------------
  // Login
  // -------------------------------
  const login = async (email: string, pass: string) => {
    if (!firebaseAuth) return { success: false, message: 'Auth unavailable' };

    setIsUserProfileLoading(true); // Set loading before attempting sign-in
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, pass);
      // onAuthStateChanged will handle the rest, including setting loading to false
      return { success: true, message: 'Login successful!' };
    } catch (err: any) {
      setIsUserProfileLoading(false); // Ensure loading is false on failure
      setLoading(false);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  // -------------------------------
  // Signup
  // -------------------------------
  const signup = async (email: string, pass: string): Promise<{ success: boolean; message: string, user: User | null, userProfile: UserProfile | null }> => {
    if (!firebaseAuth || !firebaseFirestore) return { success: false, message: "Authentication service is not available.", user: null, userProfile: null };
    setIsUserProfileLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      const newUser = userCredential.user;
      
      const username = email.split('@')[0];
      const avatar = `https://picsum.photos/seed/${newUser.uid}/200`;

      const profile: UserProfile = {
        uid: newUser.uid,
        displayUid: Math.floor(10000000 + Math.random() * 90000000).toString(),
        name: username,
        email,
        avatarUrl: avatar,
        points: 0,
        isVIP: false,
        isVerified: false,
        isCreator: false,
        isMemeCreator: false,
        isBetaTester: false,
        createdAt: serverTimestamp() as Timestamp,
        lastSeen: serverTimestamp() as Timestamp,
        selectedVerifiedContacts: [],
        hasMadeVipSelection: false,
        blockedUsers: [],
        badgeOrder: [],
        badgeExpiry: {},
        chatIds: [],
        chatColorPreferences: {},
        hasCompletedOnboarding: false, // Set to false on signup
      };
      
      await setDoc(doc(firebaseFirestore, 'users', newUser.uid), profile);
      await sendWelcomeMessage(newUser.uid);
      
      // Manually set user and profile to avoid race conditions with observer
      setUser(newUser);
      setUserProfile(profile);

      setIsUserProfileLoading(false);
      setLoading(false);

      return { success: true, message: 'Signup complete!', user: newUser, userProfile: profile };
      
    } catch (err: any) {
      setIsUserProfileLoading(false);
      setLoading(false);
      return { success: false, message: err.message || 'Signup failed', user: null, userProfile: null };
    }
  };


  // -------------------------------
  // Logout
  // -------------------------------
  const logout = async () => {
    if (!firebaseAuth || !user) return;

    await updateUserInFirestore(user.uid, { lastSeen: serverTimestamp() });
    await signOut(firebaseAuth);
    setUser(null);
    setUserProfile(null);
  };

  const value = {
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
    updateMockUserProfile,
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
