// src/types/user.ts
import type { Timestamp } from 'firebase/firestore';
import type { BadgeType } from '@/app/(app)/layout';

export interface UserProfile {
  uid: string;
  displayUid?: string;
  name: string;
  email: string | null;
  avatarUrl?: string; 
  points?: number;
  isVIP?: boolean;
  vipPack?: string;
  vipExpiryTimestamp?: number;
  createdAt?: Timestamp;
  isBot?: boolean;
  isVerified?: boolean;
  isCreator?: boolean; 
  isMemeCreator?: boolean;
  isBetaTester?: boolean;
  lastSeen?: Timestamp; 
  selectedVerifiedContacts?: string[]; 
  allowedNormalContacts?: string[];
  hasMadeVipSelection?: boolean;
  blockedUsers?: string[];
  badgeOrder?: BadgeType[];
  badgeExpiry?: {
    [key in BadgeType]?: number;
  };
  chatColorPreferences?: { [chatId: string]: string | null };
  giftedByUid?: string;
  hasNewGift?: boolean;
  lastGiftedBadge?: BadgeType;
  pointsGifterUid?: string;
  hasNewPointsGift?: boolean;
  lastGiftedPointsAmount?: number;
}
