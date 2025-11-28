
// src/context/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth'; // Firebase User type
import type { Timestamp } from 'firebase/firestore'; // Firestore Timestamp type
import { 
    getUserProfile as fetchUserProfileFromMock, 
    updateUserProfile as syncUserProfileToMock,
    setDemoUserId, 
    notifyChatListListeners,
    getPersistedUsers,
    saveUsersToLocalStorage,
    getUserProfile,
} from '@/services/firestore'; 
import type { UserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import type { BadgeType } from '@/app/(app)/layout';

export interface GiftInfo {
    gifterProfile: UserProfile | null;
    giftedBadge: BadgeType | null;
}

interface AuthContextProps {
  user: User | null; 
  userProfile: UserProfile | null; 
  loading: boolean; 
  isUserProfileLoading: boolean;
  giftInfo: GiftInfo;
  setGiftInfo: React.Dispatch<React.SetStateAction<GiftInfo>>;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  signup: (name: string, email: string, pass: string, avatarDataUri?: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  logout: () => Promise<void>;
  updateMockUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const SESSION_COOKIE_NAME = 'echoMessageSessionToken';
const LOGGED_IN_EMAIL_KEY = 'echoMessageLoggedInEmail';

const setSessionData = (email: string, uid: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOGGED_IN_EMAIL_KEY, email);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(); 
    document.cookie = `${SESSION_COOKIE_NAME}=session-token-${uid}; expires=${expires}; path=/; SameSite=Lax`;
};

const clearSessionData = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOGGED_IN_EMAIL_KEY);
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(false);
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({ gifterProfile: null, giftedBadge: null });
  const { toast } = useToast();

  const updateMockUserProfile = useCallback(async (uid: string, data: Partial<UserProfile>) => {
    const users = getPersistedUsers();
    let userWasUpdated = false;
    const updatedUsers = users.map(u => {
      if (u.uid === uid) {
        userWasUpdated = true;
        const updatedProfile = { ...u, ...data };
        
        // This handles live updates for the currently logged-in user
        if (user?.uid === uid) {
          setUserProfile(updatedProfile); 
          setUser(prevUser => prevUser ? ({ 
            ...prevUser,
            displayName: updatedProfile.name || prevUser.displayName,
            photoURL: updatedProfile.avatarUrl || prevUser.photoURL,
          }) as User : null);
        }
        return updatedProfile;
      }
      return u;
    });

     if(userWasUpdated){
        console.log("AuthProvider: Updating user profile in storage for", uid, data);
        saveUsersToLocalStorage(updatedUsers);
        notifyChatListListeners(uid); // Notify that this user's data has changed
     } else {
        console.warn("AuthProvider: Attempted to update profile for UID not in user store:", uid);
     }
  }, [user?.uid]);


  const processLogin = useCallback(async (profile: UserProfile): Promise<UserProfile> => {
    let updatedProfile = { ...profile };
    let profileWasModified = false;

    // Check for gifted badges
    if (updatedProfile.hasNewGift && updatedProfile.giftedByUid && updatedProfile.lastGiftedBadge) {
        const gifterProfile = await getUserProfile(updatedProfile.giftedByUid);
        
        if (gifterProfile) {
            setGiftInfo({
                gifterProfile: gifterProfile,
                giftedBadge: updatedProfile.lastGiftedBadge as BadgeType,
            });
        }
      
      // Clear the flags after processing
      delete updatedProfile.hasNewGift;
      delete updatedProfile.giftedByUid;
      delete updatedProfile.lastGiftedBadge;
      profileWasModified = true;
    }
    
    // Check for expired badges
    if (updatedProfile.badgeExpiry) {
        const now = Date.now();
        const badgeExpiry = { ...updatedProfile.badgeExpiry };
        let expiredBadgeName = '';

        for (const key in badgeExpiry) {
            const badgeType = key as BadgeType;
            if (badgeExpiry[badgeType] && badgeExpiry[badgeType]! < now) {
                const badgeKey = `is${badgeType.charAt(0).toUpperCase() + badgeType.slice(1).replace(/_([a-z])/g, g => g[1].toUpperCase())}` as keyof UserProfile;
                (updatedProfile as any)[badgeKey] = false;
                delete badgeExpiry[badgeType];
                profileWasModified = true;
                if(badgeType === 'meme_creator') expiredBadgeName = 'Meme Creator';
                if(badgeType === 'beta_tester') expiredBadgeName = 'Beta Tester';
                if(badgeType === 'vip') expiredBadgeName = 'VIP';
            }
        }
        updatedProfile.badgeExpiry = badgeExpiry;
        if(expiredBadgeName) {
            toast({
                title: 'Trial Badge Expired',
                description: `Your ${expiredBadgeName} trial badge has expired.`,
                variant: 'destructive',
            });
        }
    }

    if (profileWasModified) {
        // Silently update the profile in the background
        updateMockUserProfile(updatedProfile.uid, updatedProfile);
    }
    
    return updatedProfile;

  }, [toast, updateMockUserProfile]);

  useEffect(() => {
    console.log("AuthProvider: Simulating initial auth check.");
    setLoading(true);
    setIsUserProfileLoading(true);

    const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem(LOGGED_IN_EMAIL_KEY) : null;
    
    if (storedUserEmail) {
      const users = getPersistedUsers();
      const foundUserInStorage = users.find(u => u.email === storedUserEmail);
      
      if (foundUserInStorage) {
        
        processLogin(foundUserInStorage).then(loggedInProfile => {
            loggedInProfile.lastSeen = { seconds: Math.floor(Date.now()/1000), nanoseconds: 0 } as unknown as Timestamp;
    
            const mockUserObj = {
              uid: loggedInProfile.uid,
              email: loggedInProfile.email,
              displayName: loggedInProfile.name,
              photoURL: loggedInProfile.avatarUrl,
              emailVerified: true, 
            } as User; 
    
            setUser(mockUserObj);
            setUserProfile(loggedInProfile);
            setDemoUserId(loggedInProfile.uid);
            setSessionData(loggedInProfile.email!, loggedInProfile.uid);
            console.log("AuthProvider: Restored session for", loggedInProfile.email);
            
            // Persist the change of lastSeen
            const userIndex = users.findIndex(u => u.uid === loggedInProfile.uid);
            if (userIndex !== -1) {
                const updatedUsers = [...users];
                updatedUsers[userIndex] = loggedInProfile;
                saveUsersToLocalStorage(updatedUsers);
            }
        });
        
      } else {
         clearSessionData();
      }
    }
    setLoading(false);
    setIsUserProfileLoading(false);
  }, [processLogin]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }> => {
    console.log("AuthProvider: Attempting login for", email);
    setLoading(true);
    setIsUserProfileLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    const users = getPersistedUsers();
    const foundUser = users.find(u => u.email === email.toLowerCase());

    if (foundUser) {
      const loggedInProfile = await processLogin(foundUser);
      loggedInProfile.lastSeen = { seconds: Math.floor(Date.now()/1000), nanoseconds: 0 } as unknown as Timestamp; // Update last seen on login

      const mockUserObj = { 
          uid: loggedInProfile.uid, 
          email: loggedInProfile.email, 
          displayName: loggedInProfile.name, 
          photoURL: loggedInProfile.avatarUrl,
          emailVerified: true,
       } as User;
      setUser(mockUserObj);
      setUserProfile(loggedInProfile);
      setDemoUserId(loggedInProfile.uid);
      setSessionData(loggedInProfile.email!, loggedInProfile.uid);
      
      // Persist the change of lastSeen
      const userIndex = users.findIndex(u => u.uid === loggedInProfile.uid);
      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = loggedInProfile;
        saveUsersToLocalStorage(updatedUsers);
      }

      setLoading(false);
      setIsUserProfileLoading(false);
      console.log("AuthProvider: Login successful for", email);
      
      return { success: true, message: "Login successful!", user: mockUserObj, userProfile: loggedInProfile };
    } else {
      setLoading(false);
      setIsUserProfileLoading(false);
      console.log("AuthProvider: Login failed for", email);
      return { success: false, message: "Invalid email or password" };
    }
  }, [processLogin]);

  const signup = useCallback(async (name: string, email: string, pass: string, avatarDataUri?: string): Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }> => {
    console.log("AuthProvider: Attempting signup for", email);
    setLoading(true);
    setIsUserProfileLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getPersistedUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      setLoading(false);
      setIsUserProfileLoading(false);
      console.log("AuthProvider: Signup failed, email exists:", email);
      return { success: false, message: "Email already in use" };
    }

    const newUserUid = `user-${Date.now()}`;
    const newUserDisplayUid = Math.floor(10000000 + Math.random() * 90000000).toString();

    const newUserProfile: UserProfile = {
      uid: newUserUid,
      displayUid: newUserDisplayUid,
      name: name,
      email: email.toLowerCase(),
      avatarUrl: avatarDataUri || `https://picsum.photos/seed/${newUserUid}/200`,
      isVIP: false,
      createdAt: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as Timestamp,
      isVerified: false,
      isCreator: false,
      isMemeCreator: false,
      isBetaTester: false,
      lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as Timestamp,
      selectedVerifiedContacts: [],
      hasMadeVipSelection: false,
      blockedUsers: [],
      badgeOrder: [],
      badgeExpiry: {},
      chatColorPreferences: {},
    };
    
    const updatedUsers = [...users, newUserProfile];
    saveUsersToLocalStorage(updatedUsers);

    const mockUserForSync = { uid: newUserProfile.uid, email: newUserProfile.email, displayName: newUserProfile.name, photoURL: newUserProfile.avatarUrl, emailVerified: true } as User;
    await syncUserProfileToMock(mockUserForSync, newUserProfile);


    const mockUserObj = { 
        uid: newUserProfile.uid, 
        email: newUserProfile.email, 
        displayName: newUserProfile.name, 
        photoURL: newUserProfile.avatarUrl,
        emailVerified: true, 
    } as User;
    setUser(mockUserObj);
    setUserProfile(newUserProfile);
    setDemoUserId(newUserProfile.uid);
    setSessionData(newUserProfile.email!, newUserProfile.uid);

    setLoading(false);
    setIsUserProfileLoading(false);
    console.log("AuthProvider: Signup successful for", email, newUserProfile);
    return { success: true, message: "Signup successful! Welcome.", user: mockUserObj, userProfile: newUserProfile };
  }, [syncUserProfileToMock]);

  const logout = useCallback(async () => {
    console.log("AuthProvider: Logging out.");
    const users = getPersistedUsers();
    if (user) {
        // Set last seen to 5 mins ago on logout to simulate going offline
        const userIndex = users.findIndex(u => u.uid === user.uid);
        if(userIndex > -1){
            users[userIndex].lastSeen = { seconds: Math.floor(Date.now()/1000) - (5 * 60) , nanoseconds: 0 } as Timestamp;
            saveUsersToLocalStorage(users);
        }
    }
    setUser(null);
    setUserProfile(null);
    clearSessionData();
  }, [user]);

  const value = { user, userProfile, loading, isUserProfileLoading, giftInfo, setGiftInfo, login, signup, logout, updateMockUserProfile };

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
