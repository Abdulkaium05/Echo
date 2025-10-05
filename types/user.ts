// src/types/user.ts
import type { Timestamp } from 'firebase/firestore';
import type { BadgeType } from '@/app/(app)/layout';

export interface UserProfile {
  uid: string;
  displayUid?: string; // The new 8-digit user ID
  name: string;
  email: string | null;
  avatarUrl?: string; 
  isVIP?: boolean;
  vipPack?: string;
  vipExpiryTimestamp?: number; // Unix timestamp in milliseconds for VIP expiry
  createdAt?: Timestamp;
  isBot?: boolean;
  isVerified?: boolean;
  isDevTeam?: boolean;
  isCreator?: boolean; 
  lastSeen?: Timestamp; 
  selectedVerifiedContacts?: string[]; 
  allowedNormalContacts?: string[]; // List of normal user UIDs this verified user allows to message them.
  hasMadeVipSelection?: boolean;
  blockedUsers?: string[]; // List of UIDs this user has blocked
  
  // Badge Management
  badgeOrder?: BadgeType[];

  // Chat Customization
  chatColorPreferences?: { [chatId: string]: string | null };
}
