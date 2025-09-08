
// src/context/auth-context.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth'; // Firebase User type
import type { Timestamp } from 'firebase/firestore'; // Firestore Timestamp type
import { 
    getUserProfile as fetchUserProfileFromMock, 
    updateUserProfile as syncUserProfileToMock,
    mockLocalUsers, 
    setDemoUserId 
} from '@/services/firestore'; 
import type { UserProfile } from '@/types/user';
import type { BadgeType } from '@/app/(app)/layout';

interface AuthContextProps {
  user: User | null; 
  userProfile: UserProfile | null; 
  loading: boolean; 
  isUserProfileLoading: boolean; 
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  signup: (name: string, email: string, pass: string, avatarDataUri?: string) => Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }>;
  logout: () => Promise<void>;
  updateMockUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

let authContextMockUsers: UserProfile[] = [...mockLocalUsers]; 

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

  useEffect(() => {
    console.log("AuthProvider: Simulating initial auth check.");
    setLoading(true);
    setIsUserProfileLoading(true);
    const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem(LOGGED_IN_EMAIL_KEY) : null;
    
    if (storedUserEmail) {
      const foundUserInAuthContext = authContextMockUsers.find(u => u.email === storedUserEmail);
      if (foundUserInAuthContext) {
        // Update last seen on session restore
        foundUserInAuthContext.lastSeen = { seconds: Math.floor(Date.now()/1000), nanoseconds: 0 } as unknown as Timestamp;

        const mockUserObj = {
          uid: foundUserInAuthContext.uid,
          email: foundUserInAuthContext.email,
          displayName: foundUserInAuthContext.name,
          photoURL: foundUserInAuthContext.avatarUrl,
          emailVerified: true, 
        } as User; 
        setUser(mockUserObj);
        setUserProfile(foundUserInAuthContext);
        setDemoUserId(foundUserInAuthContext.uid); 
        setSessionData(foundUserInAuthContext.email!, foundUserInAuthContext.uid);
        console.log("AuthProvider: Restored session for", foundUserInAuthContext.email);
      } else {
         clearSessionData();
      }
    }
    setLoading(false);
    setIsUserProfileLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }> => {
    console.log("AuthProvider: Attempting login for", email);
    setLoading(true);
    setIsUserProfileLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const foundUser = authContextMockUsers.find(u => u.email === email.toLowerCase());
    if (foundUser) {
      foundUser.lastSeen = { seconds: Math.floor(Date.now()/1000), nanoseconds: 0 } as unknown as Timestamp; // Update last seen on login
      const mockUserObj = { 
          uid: foundUser.uid, 
          email: foundUser.email, 
          displayName: foundUser.name, 
          photoURL: foundUser.avatarUrl,
          emailVerified: true,
       } as User;
      setUser(mockUserObj);
      setUserProfile(foundUser);
      setDemoUserId(foundUser.uid);
      setSessionData(foundUser.email!, foundUser.uid);
      setLoading(false);
      setIsUserProfileLoading(false);
      console.log("AuthProvider: Login successful for", email);
      return { success: true, message: "Login successful!", user: mockUserObj, userProfile: foundUser };
    } else {
      setLoading(false);
      setIsUserProfileLoading(false);
      console.log("AuthProvider: Login failed for", email);
      return { success: false, message: "Invalid email or password" };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, pass: string, avatarDataUri?: string): Promise<{ success: boolean; message: string; user?: User; userProfile?: UserProfile }> => {
    console.log("AuthProvider: Attempting signup for", email);
    setLoading(true);
    setIsUserProfileLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (authContextMockUsers.find(u => u.email === email.toLowerCase())) {
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
      lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as Timestamp,
      selectedVerifiedContacts: [],
      hasMadeVipSelection: false,
      blockedUsers: [],
      badgeOrder: [],
      chatColorPreferences: {},
    };
    
    authContextMockUsers.push(newUserProfile);
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
  }, []);

  const logout = useCallback(async () => {
    console.log("AuthProvider: Logging out.");
    if (user && userProfile) {
        // Set last seen to 5 mins ago on logout to simulate going offline
        const updatedProfile = { 
            ...userProfile, 
            lastSeen: { seconds: Math.floor(Date.now()/1000) - (5 * 60) , nanoseconds: 0 } as Timestamp 
        }; 
        authContextMockUsers = authContextMockUsers.map(u => u.uid === user.uid ? updatedProfile : u);
    }
    setUser(null);
    setUserProfile(null);
    clearSessionData();
  }, [user, userProfile]);

  const updateMockUserProfile = useCallback(async (uid: string, data: Partial<UserProfile>) => {
    let userWasUpdatedInAuthContext = false;
    authContextMockUsers = authContextMockUsers.map(u => {
      if (u.uid === uid) {
        userWasUpdatedInAuthContext = true;
        const updatedProfile = { ...u, ...data };
        if (user?.uid === uid) {
          setUserProfile(updatedProfile); 
          setUser(prevUser => prevUser ? ({ 
            ...prevUser,
            displayName: updatedProfile.name || prevUser.displayName,
            photoURL: updatedProfile.avatarUrl || prevUser.photoURL,
          }) as User : null);
        }
        const mockUserForSync = { uid: updatedProfile.uid, email: updatedProfile.email, displayName: updatedProfile.name, photoURL: updatedProfile.avatarUrl, emailVerified: true } as User;
        syncUserProfileToMock(mockUserForSync, updatedProfile);
        return updatedProfile;
      }
      return u;
    });

     if(userWasUpdatedInAuthContext){
        console.log("AuthProvider: Updated user profile in AuthContext for", uid, data);
     } else {
        console.warn("AuthProvider: Attempted to update profile for UID not in authContextMockUsers:", uid);
     }
  }, [user?.uid]); 

  const value = { user, userProfile, loading, isUserProfileLoading, login, signup, logout, updateMockUserProfile };

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

export { authContextMockUsers };
