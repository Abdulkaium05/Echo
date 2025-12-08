// src/types/user.ts
import type { Timestamp } from 'firebase/firestore';
import type { BadgeType } from '@/app/(app)/layout';

export interface UserProfile {
  uid: string;
  displayUid?: string; // The new 8-digit user ID
  name: string;
  email: string | null;
  avatarUrl?: string; 
  points?: number; // User's points balance
  isVIP?: boolean;
  vipPack?: string;
  vipExpiryTimestamp?: number; // Unix timestamp in milliseconds for VIP expiry
  createdAt?: Timestamp;
  isBot?: boolean;
  isVerified?: boolean;
  isDevTeam?: boolean;
  isCreator?: boolean; 
  isMemeCreator?: boolean; // New badge property
  isBetaTester?: boolean;  // New badge property
  lastSeen?: Timestamp; 
  blockedUsers?: string[]; // List of UIDs this user has blocked
  
  // Badge Management
  badgeOrder?: BadgeType[];
  badgeExpiry?: { // New property to store expiry dates for gifted badges
    [key in BadgeType]?: number | null; // Unix timestamp in ms or null for lifetime
  };

  // Chat Customization
  chatColorPreferences?: { [chatId: string]: string | null };

  // Onboarding
  hasCompletedOnboarding?: boolean;

  // Transient property for notifications
  giftedByUid?: string;
  hasNewGift?: boolean;
  lastGiftedBadge?: BadgeType;
  
  pointsGifterUid?: string;
  hasNewPointsGift?: boolean;
  lastGiftedPointsAmount?: number;

  // FCM Tokens
  fcmTokens?: string[];
}
