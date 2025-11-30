// src/services/firestore.ts
import { firestore } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
  runTransaction,
  limit
} from 'firebase/firestore';

import type { UserProfile } from '@/types/user';
import type { ChatItemProps } from '@/components/chat/chat-item';

export const BOT_UID = 'blue-bird-bot';
export const DEV_UID = 'vip-dev';

export type { UserProfile };

export interface VipPromoCode {
  code: string;
  durationDays: number;
  totalUses: number;
  usesPerUser: number;
  claimedBy: { [userId: string]: number };
  createdAt: Timestamp;
}

export interface PointsPromoCode {
    code: string;
    amount: number;
    totalUses: number;
    claimedBy: { [userId: string]: number };
    createdAt: Timestamp;
}

export interface BadgeGiftCode {
    type: 'badge_gift';
    code: string;
    badgeType: string;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    claimedBy: { [userId: string]: number };
    createdAt: Timestamp;
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userRef = doc(firestore, 'users', uid);
    return updateDoc(userRef, data);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { uid: userSnap.id, ...userSnap.data() } as UserProfile;
    }
    return null;
};

export const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
};


export interface Chat {
  id?: string;
  participants: string[];
  participantDetails?: { [uid: string]: Partial<UserProfile> };
  lastMessage: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp: Timestamp;
  createdAt?: Timestamp;
}

export interface MessageReaction {
    count: number;
    users: string[]; 
}

export interface Message {
    id?: string;
    chatId: string;
    senderId: string;
    senderName?: string; 
    text: string;
    timestamp: Timestamp;
    isSentByCurrentUser?: boolean;
    isDeleted?: boolean;
    seenBy?: string[];
    replyingTo?: {
        id: string;
        senderName: string;
        textSnippet: string;
        wasImage?: boolean; 
        wasAttachment?: boolean; 
        attachmentType?: 'image' | 'video' | 'document' | 'audio' | 'other'; 
        attachmentName?: string; 
    } | null;
    reactions?: {
        [emoji: string]: MessageReaction;
    };
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: 'image' | 'video' | 'document' | 'audio' | 'other';
    audioDuration?: number;
    isWittyReactionResponse?: boolean; 
    repliedToReactionOnMessageId?: string; 
    repliedToReactionEmoji?: string; 
}

export const getUserChats = (
    userId: string,
    userProfile: UserProfile,
    callback: (chats: Chat[]) => void,
    onError: (error: Error) => void
): (() => void) => {
  if (!firestore) {
      onError(new Error("Firestore not initialized"));
      return () => {};
  }
  const q = query(collection(firestore, 'chats'), where('participants', 'array-contains', userId));
  
  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const chats: Chat[] = [];
    const promises = querySnapshot.docs.map(async (docSnap) => {
      const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
      
      const otherParticipantId = chatData.participants.find(p => p !== userId);
      if(otherParticipantId) {
        const otherParticipantProfile = await getUserProfile(otherParticipantId);
        if(otherParticipantProfile) {
            chatData.participantDetails = {
                ...chatData.participantDetails,
                [otherParticipantId]: otherParticipantProfile
            };

             const isOtherUserExclusive = otherParticipantProfile.isVerified || otherParticipantProfile.isCreator || otherParticipantProfile.isDevTeam;
             const hasVipAccess = userProfile.isVIP || userProfile.isVerified || userProfile.isCreator || userProfile.isDevTeam;

             if (!isOtherUserExclusive || otherParticipantProfile.isBot) {
                chats.push(chatData);
             } else {
                const isAllowedByOtherUser = otherParticipantProfile.allowedNormalContacts?.includes(userId);
                const isSelectedByCurrentUser = userProfile.selectedVerifiedContacts?.includes(otherParticipantId);
                if (isAllowedByOtherUser || (hasVipAccess && isSelectedByCurrentUser)) {
                    chats.push(chatData);
                }
             }
        }
      }
    });

    await Promise.all(promises);
    
    // Sort by last message timestamp before calling back
    chats.sort((a, b) => b.lastMessageTimestamp.seconds - a.lastMessageTimestamp.seconds);

    callback(chats);
  }, onError);

  return unsubscribe;
};

export const findChatBetweenUsers = async (userId1: string, userId2: string): Promise<string | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const sorted = [userId1, userId2].sort();
    const q = query(collection(firestore, 'chats'), where('participants', '==', sorted), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    }
    return null;
};

export const createChat = async (userId1: string, userId2: string): Promise<string> => {
    if (!firestore) throw new Error("Firestore not initialized");

    const existingChatId = await findChatBetweenUsers(userId1, userId2);
    if (existingChatId) return existingChatId;

    const newChatRef = await addDoc(collection(firestore, 'chats'), {
        participants: [userId1, userId2].sort(),
        createdAt: serverTimestamp(),
        lastMessage: 'Chat created.',
        lastMessageSenderId: 'system',
        lastMessageTimestamp: serverTimestamp(),
    });
    return newChatRef.id;
};

export const sendWelcomeMessage = async (newUserId: string): Promise<void> => {
  if (!firestore) throw new Error("Firestore not initialized");
  try {
    const chatId = await createChat(newUserId, BOT_UID);
    const welcomeText = "Welcome to Echo Message! 🎉 I'm Blue Bird, your AI Assistant. How can I assist you today?";
    await sendMessage(chatId, BOT_UID, welcomeText);
  } catch (error) {
    console.error(`[sendWelcomeMessage] Error:`, error);
  }
};


export const getChatMessages = (
    chatId: string,
    callback: (messages: Message[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!firestore) {
        onError(new Error("Firestore not initialized"));
        return () => {};
    }
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    }, onError);

    return unsubscribe;
};

export const sendMessage = async (
    chatId: string,
    senderId: string,
    text: string,
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number },
    replyingTo?: Message['replyingTo']
): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");

    const trimmedText = text.trim();
    if (!trimmedText && !attachmentData) throw new Error("Cannot send an empty message.");

    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const chatRef = doc(firestore, 'chats', chatId);

    const newMessage: Omit<Message, 'id' | 'isSentByCurrentUser'> = {
        chatId,
        senderId,
        text: trimmedText,
        timestamp: serverTimestamp() as Timestamp,
        replyingTo: replyingTo || null,
        reactions: {},
        attachmentUrl: attachmentData?.dataUri,
        attachmentName: attachmentData?.name,
        attachmentType: attachmentData?.type,
        audioDuration: attachmentData?.duration,
    };
    
    await addDoc(messagesRef, newMessage);

    let lastMsgText = trimmedText;
    if (attachmentData?.type === 'image') lastMsgText = trimmedText ? `${trimmedText} [Photo]` : "[Photo]";
    else if (attachmentData?.type === 'video') lastMsgText = trimmedText ? `${trimmedText} [Video]` : "[Video]";
    else if (attachmentData?.type === 'audio') lastMsgText = "[Audio Message]";
    else if (attachmentData?.type === 'document') lastMsgText = trimmedText ? `${trimmedText} [${attachmentData.name || 'Document'}]` : `[${attachmentData.name || 'Document'}]`;

    await updateDoc(chatRef, {
        lastMessage: lastMsgText,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: senderId,
    });
};

export const deleteMessage = async (chatId: string, messageId: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
        text: "This message was deleted.",
        attachmentUrl: null,
        attachmentName: null,
        attachmentType: null,
        isDeleted: true,
        reactions: {},
        replyingTo: null,
    });
};

export const removeChat = async (chatId: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    // In a real app, this might archive the chat or handle it differently.
    // For now, we just delete the document.
    const chatRef = doc(firestore, 'chats', chatId);
    await deleteDoc(chatRef);
}

export const updateVIPStatus = async (userId: string, isVIP: boolean, vipPack?: string, durationDays?: number): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        isVIP,
        vipPack: isVIP ? vipPack : null,
        vipExpiryTimestamp: isVIP && durationDays && durationDays !== Infinity ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : null,
        selectedVerifiedContacts: isVIP ? arrayUnion() : [], // Keep existing or reset
        hasMadeVipSelection: isVIP ? true : false,
    });
};

export const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return '';
  }
  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (date > oneWeekAgo) {
       return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString();
  }
};

export const formatLastSeen = (timestamp: Timestamp | any | null | undefined): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return '...';
    }
    const now = new Date();
    const lastSeenDate = timestamp.toDate();
    const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 1) return 'Online';
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return `Active yesterday`;
    return `Active ${diffDays}d ago`;
};

export const mapChatToChatItem = (
    chat: Chat, 
    currentUserId: string,
): ChatItemProps => {
    const otherParticipantId = chat.participants.find(p => p !== currentUserId);
    if (!otherParticipantId) {
      return { id: chat.id!, name: 'Error', contactUserId: '', lastMessage: 'Invalid chat', timestamp: '', lastMessageTimestampValue: 0, href: `/chat/${chat.id}` } as unknown as ChatItemProps;
    }
    const otherDetails = chat.participantDetails?.[otherParticipantId];

    return {
      id: chat.id!,
      name: otherDetails?.name || 'Chat User',
      contactUserId: otherParticipantId,
      avatarUrl: otherDetails?.avatarUrl,
      lastMessage: chat.lastMessage,
      timestamp: formatTimestamp(chat.lastMessageTimestamp),
      lastMessageTimestampValue: chat.lastMessageTimestamp.seconds,
      isVerified: !!otherDetails?.isVerified,
      isContactVIP: !!otherDetails?.isVIP,
      isDevTeam: !!otherDetails?.isDevTeam,
      isBot: !!otherDetails?.isBot,
      isCreator: !!otherDetails?.isCreator,
      isMemeCreator: !!otherDetails?.isMemeCreator,
      isBetaTester: !!otherDetails?.isBetaTester,
      badgeOrder: otherDetails?.badgeOrder,
      href: `/chat/${chat.id}`,
      isLastMessageSentByCurrentUser: chat.lastMessageSenderId === currentUserId,
      isOnline: otherDetails?.lastSeen ? formatLastSeen(otherDetails.lastSeen) === 'Online' : false,
      onBlockUser: () => {},
      onUnblockUser: () => {},
      onDeleteChat: () => {},
      onViewProfile: () => {},
    };
};

export const toggleReaction = async (chatId: string, messageId: string, emoji: string, userId: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);

    await runTransaction(firestore, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        if (!messageDoc.exists()) throw "Message does not exist!";

        const data = messageDoc.data();
        const reactions = data.reactions || {};
        const existingReaction = reactions[emoji];

        if (existingReaction && existingReaction.users.includes(userId)) {
            // User is removing their reaction
            transaction.update(messageRef, {
                [`reactions.${emoji}.count`]: existingReaction.count - 1,
                [`reactions.${emoji}.users`]: arrayRemove(userId)
            });
        } else {
            // User is adding a new reaction
            // First, remove any previous reaction from this user
            for (const key in reactions) {
                if (reactions[key].users.includes(userId)) {
                    transaction.update(messageRef, {
                        [`reactions.${key}.count`]: reactions[key].count - 1,
                        [`reactions.${key}.users`]: arrayRemove(userId)
                    });
                }
            }
            // Add the new reaction
            transaction.update(messageRef, {
                [`reactions.${emoji}.count`]: (existingReaction?.count || 0) + 1,
                [`reactions.${emoji}.users`]: arrayUnion(userId)
            });
        }
    });
};

export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('senderId', '!=', userId), where('seenBy', 'not-in', [userId]));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(firestore);
    querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { seenBy: arrayUnion(userId) });
    });
    
    await batch.commit();
};

export const getVerifiedUsers = async (): Promise<UserProfile[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('isVerified', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const getNormalUsers = async (): Promise<UserProfile[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('isVerified', '!=', true), where('isDevTeam', '!=', true), where('isBot', '!=', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const getVerifiedContactLimit = (vipPack?: string): number => {
    if (!vipPack) return 0;
    const pack = vipPack.toLowerCase();
    if (pack.includes('gold') || pack.includes('platinum') || pack.includes('diamond') || pack.includes('elite')) return 10;
    if (pack.includes('starter') || pack.includes('bronze') || pack.includes('silver')) return 5;
    if (pack.includes('micro') || pack.includes('mini') || pack.includes('basic')) return 3;
    return 0;
};

export const createVipPromoCode = async (durationDays: number, totalUses: number, usesPerUser: number): Promise<string> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const code = `VIP-${durationDays}D-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const codeRef = doc(firestore, 'vipPromoCodes', code);
    await setDoc(codeRef, { durationDays, totalUses, usesPerUser, claimedBy: {}, createdAt: serverTimestamp() });
    return code;
};

export const redeemVipPromoCode = async (userId: string, code: string): Promise<{ success: boolean, durationDays: number }> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const codeRef = doc(firestore, 'vipPromoCodes', code);

    return runTransaction(firestore, async (transaction) => {
        const codeDoc = await transaction.get(codeRef);
        if (!codeDoc.exists()) throw new Error("Invalid promo code.");

        const promoCode = codeDoc.data() as VipPromoCode;
        const totalClaims = Object.values(promoCode.claimedBy || {}).reduce((sum, count) => sum + count, 0);

        if (totalClaims >= promoCode.totalUses) throw new Error("This promo code has reached its maximum uses.");
        
        const userClaims = promoCode.claimedBy[userId] || 0;
        if (userClaims >= promoCode.usesPerUser) throw new Error("You have already redeemed this promo code the maximum number of times.");
        
        transaction.update(codeRef, { [`claimedBy.${userId}`]: (userClaims + 1) });
        
        const userRef = doc(firestore, 'users', userId);
        transaction.update(userRef, {
            isVIP: true,
            vipPack: `Promo (${promoCode.durationDays} days)`,
            vipExpiryTimestamp: Date.now() + promoCode.durationDays * 24 * 60 * 60 * 1000
        });

        return { success: true, durationDays: promoCode.durationDays };
    });
};

export const createBadgeGiftCode = async (badgeType: string, durationDays: number, totalUses: number, usesPerUser: number): Promise<BadgeGiftCode> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const code = `GIFT-${badgeType.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const codeRef = doc(firestore, 'badgeGiftCodes', code);
    const newCode: Omit<BadgeGiftCode, 'code'> & {createdAt: any} = {
        type: 'badge_gift',
        badgeType,
        durationDays,
        totalUses,
        usesPerUser,
        claimedBy: {},
        createdAt: serverTimestamp(),
    };
    await setDoc(codeRef, newCode);
    return { ...newCode, code, createdAt: Timestamp.now() };
};

export const redeemBadgeGiftCode = async (userId: string, code: string): Promise<{ success: true, badgeType: string, durationDays: number }> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const codeRef = doc(firestore, 'badgeGiftCodes', code);
    const userRef = doc(firestore, 'users', userId);

    return runTransaction(firestore, async (transaction) => {
        const codeDoc = await transaction.get(codeRef);
        if (!codeDoc.exists()) throw new Error("Invalid or expired gift code.");
        
        const giftCode = codeDoc.data() as BadgeGiftCode;
        const totalClaims = Object.values(giftCode.claimedBy || {}).reduce((sum, count) => sum + count, 0);
        if (totalClaims >= giftCode.totalUses) throw new Error("This gift code has reached its maximum uses.");

        const userClaims = (giftCode.claimedBy || {})[userId] || 0;
        if (userClaims >= giftCode.usesPerUser) throw new Error("You have already claimed this gift code.");

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");

        const badgeKey = `is${giftCode.badgeType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        const expiryKey = `badgeExpiry.${giftCode.badgeType}`;

        let updateData: any = { [badgeKey]: true };
        if (giftCode.durationDays !== Infinity) {
            updateData[expiryKey] = Date.now() + giftCode.durationDays * 24 * 60 * 60 * 1000;
        }

        transaction.update(userRef, updateData);
        transaction.update(codeRef, { [`claimedBy.${userId}`]: (userClaims + 1) });
        
        return { success: true, badgeType: giftCode.badgeType, durationDays: giftCode.durationDays };
    });
};

export const getVipPromoCodes = async (): Promise<VipPromoCode[]> => {
    if (!firestore) return [];
    const codesRef = collection(firestore, 'vipPromoCodes');
    const q = query(codesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() } as VipPromoCode));
};

export const getBadgeGiftCodes = async (): Promise<BadgeGiftCode[]> => {
    if (!firestore) return [];
    const codesRef = collection(firestore, 'badgeGiftCodes');
    const q = query(codesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() } as BadgeGiftCode));
};

export const deleteVipPromoCode = async (code: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    await deleteDoc(doc(firestore, 'vipPromoCodes', code));
};

export const deleteBadgeGiftCode = async (code: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    await deleteDoc(doc(firestore, 'badgeGiftCodes', code));
};

export const createPointsPromoCode = async (amount: number, totalUses: number): Promise<string> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const code = `PTS-${amount}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const codeRef = doc(firestore, 'pointsPromoCodes', code);
    await setDoc(codeRef, { amount, totalUses, claimedBy: {}, createdAt: serverTimestamp() });
    return code;
};

export const getPointsPromoCodes = async (): Promise<PointsPromoCode[]> => {
    if (!firestore) return [];
    const codesRef = collection(firestore, 'pointsPromoCodes');
    const q = query(codesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() } as PointsPromoCode));
};

export const redeemPointsPromoCode = async (userId: string, code: string): Promise<{ success: boolean; amount: number }> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const codeRef = doc(firestore, 'pointsPromoCodes', code);
    const userRef = doc(firestore, 'users', userId);

    return runTransaction(firestore, async (transaction) => {
        const codeDoc = await transaction.get(codeRef);
        if (!codeDoc.exists()) throw new Error("Invalid points promo code.");

        const promoCode = codeDoc.data() as PointsPromoCode;
        const totalClaims = Object.values(promoCode.claimedBy || {}).length;
        if (totalClaims >= promoCode.totalUses) throw new Error("This promo code has reached its maximum uses.");
        if (promoCode.claimedBy[userId]) throw new Error("You have already redeemed this code.");
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");

        const currentPoints = userDoc.data().points || 0;
        transaction.update(userRef, { points: currentPoints + promoCode.amount });
        transaction.update(codeRef, { [`claimedBy.${userId}`]: 1 });

        return { success: true, amount: promoCode.amount };
    });
};

export const deletePointsPromoCode = async (code: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    await deleteDoc(doc(firestore, 'pointsPromoCodes', code));
};

export const giftPoints = async (fromUid: string, toUid: string, amount: number): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const fromRef = doc(firestore, 'users', fromUid);
    const toRef = doc(firestore, 'users', toUid);

    await runTransaction(firestore, async (transaction) => {
        const fromDoc = await transaction.get(fromRef);
        const toDoc = await transaction.get(toRef);

        if (!fromDoc.exists() || !toDoc.exists()) throw new Error("Sender or receiver not found.");

        const fromPoints = fromDoc.data().points || 0;
        if (fromPoints < amount) throw new Error("Insufficient points.");

        transaction.update(fromRef, { points: fromPoints - amount });
        const toPoints = toDoc.data().points || 0;
        transaction.update(toRef, { 
            points: toPoints + amount,
            hasNewPointsGift: true,
            pointsGifterUid: fromUid,
            lastGiftedPointsAmount: amount
        });
    });
};
