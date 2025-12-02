// src/services/firestore.ts
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    deleteDoc, query, where, onSnapshot, serverTimestamp, writeBatch, orderBy, limit, startAfter, Timestamp 
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { initializeFirebase, useFirestore as useFirestoreHook } from '@/firebase';
import type { ChatItemProps } from '@/components/chat/chat-item';
import type { UserProfile } from '@/types/user';
import type { BadgeType } from '@/app/(app)/layout';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export const BOT_UID = 'blue-bird-bot';
export type { UserProfile };

const db = initializeFirebase().firestore;

// --- User Management ---

export const findUserByUid = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() as UserProfile : null;
};

export const findUserByDisplayId = async (displayId: string): Promise<UserProfile | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where("displayUid", "==", displayId.trim().toLowerCase()), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDocumentNonBlocking(userDocRef, data, { merge: true });
};

// --- Authentication ---

export const initiateEmailSignUp = (auth: any, email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
}

export const initiateEmailSignIn = (auth: any, email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
}

export const initiateAnonymousSignIn = (auth: any) => {
    return signInWithEmailAndPassword(auth);
}

export const logout = (auth: any) => {
    return signOut(auth);
}

// --- Chat Management ---

export interface Chat {
  id?: string;
  participants: string[];
  participantDetails?: { [uid: string]: Partial<UserProfile> };
  lastMessage: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp: Timestamp;
  createdAt?: Timestamp;
}

export const getUserChats = (
  userId: string,
  onUpdate: (chats: Chat[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(q, async (querySnapshot) => {
    const chats: Chat[] = [];
    const participantPromises: Promise<void>[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
      chatData.participantDetails = {};

      const detailPromises = chatData.participants.map(async (pId) => {
        const userProfile = await findUserByUid(pId);
        if (userProfile) {
          chatData.participantDetails![pId] = {
            name: userProfile.name,
            avatarUrl: userProfile.avatarUrl,
            isBot: userProfile.isBot,
            isVerified: userProfile.isVerified,
            isCreator: userProfile.isCreator,
            isVIP: userProfile.isVIP,
            isDevTeam: userProfile.isDevTeam,
            isMemeCreator: userProfile.isMemeCreator,
            isBetaTester: userProfile.isBetaTester,
            badgeOrder: userProfile.badgeOrder,
            lastSeen: userProfile.lastSeen,
          };
        }
      });
      participantPromises.push(...detailPromises);
      chats.push(chatData);
    }
    
    await Promise.all(participantPromises);
    onUpdate(chats);

  }, onError);
};

export const findChatBetweenUsers = async (userId1: string, userId2: string): Promise<string | null> => {
    const sortedParticipants = [userId1, userId2].sort();
    const q = query(
        collection(db, 'chats'),
        where('participants', '==', sortedParticipants),
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].id;
};

export const createChat = async (userId1: string, userId2: string): Promise<string> => {
    const existingChatId = await findChatBetweenUsers(userId1, userId2);
    if (existingChatId) return existingChatId;

    const sortedParticipants = [userId1, userId2].sort();
    const newChatRef = doc(collection(db, 'chats'));
    const newChat: Chat = {
        id: newChatRef.id,
        participants: sortedParticipants,
        lastMessage: "Chat created",
        lastMessageSenderId: "system",
        lastMessageTimestamp: Timestamp.now(),
        createdAt: Timestamp.now()
    };
    await setDocumentNonBlocking(newChatRef, newChat, { merge: true });
    return newChatRef.id;
};

export const ensureChatWithBotExists = async (userId: string) => {
    const existingChatId = await findChatBetweenUsers(userId, BOT_UID);
    if (!existingChatId) {
        const chatId = await createChat(userId, BOT_UID);
        await sendMessage(chatId, BOT_UID, "Welcome to Echo Message! 🎉 I'm Blue Bird, your AI Assistant. How can I assist you today?", undefined, undefined, true);
    }
};

// --- Message Management ---

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


export const getChatMessages = (
    chatId: string,
    callback: (messages: Message[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() } as Message);
        });
        callback(messages);
    }, onError);
};

export const sendMessage = async (
    chatId: string,
    senderId: string,
    text: string,
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number },
    replyingTo?: Message['replyingTo'],
    isBotMessage: boolean = false,
): Promise<void> => {
    const newMessageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const chatRef = doc(db, 'chats', chatId);
    const trimmedText = text.trim();

    const newMessage: Omit<Message, 'id'> = {
        chatId,
        senderId,
        text: trimmedText,
        timestamp: Timestamp.now(),
        replyingTo: replyingTo || null,
        attachmentUrl: attachmentData?.dataUri,
        attachmentName: attachmentData?.name,
        attachmentType: attachmentData?.type,
        audioDuration: attachmentData?.duration,
        seenBy: [senderId],
    };
    
    let lastMessageText = trimmedText;
    if (attachmentData?.type === 'image') lastMessageText = "[Photo]";
    if (attachmentData?.type === 'video') lastMessageText = "[Video]";
    if (attachmentData?.type === 'audio') lastMessageText = "[Audio Message]";
    if (attachmentData?.type === 'document') lastMessageText = `[Document] ${attachmentData.name}`;

    const batch = writeBatch(db);
    batch.set(newMessageRef, newMessage);
    batch.update(chatRef, {
        lastMessage: lastMessageText,
        lastMessageSenderId: senderId,
        lastMessageTimestamp: newMessage.timestamp
    });

    await batch.commit();
};

export const deleteMessage = async (chatId: string, messageId: string): Promise<void> => {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDocumentNonBlocking(messageRef, {
        text: "This message was deleted.",
        isDeleted: true,
        attachmentUrl: null,
        attachmentName: null,
        attachmentType: null,
        reactions: null,
        replyingTo: null,
    });
};

export const toggleReaction = async (chatId: string, messageId: string, emoji: string, userId: string): Promise<void> => {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) throw new Error("Message not found.");

  const messageData = messageDoc.data() as Message;
  const reactions = messageData.reactions || {};
  
  const reaction = reactions[emoji] || { count: 0, users: [] };
  const userIndex = reaction.users.indexOf(userId);

  if (userIndex > -1) {
    reaction.count--;
    reaction.users.splice(userIndex, 1);
  } else {
    reaction.count++;
    reaction.users.push(userId);
  }

  if (reaction.count === 0) {
    delete reactions[emoji];
  } else {
    reactions[emoji] = reaction;
  }

  await updateDocumentNonBlocking(messageRef, { reactions });
};

export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('seenBy', 'not-in', [userId]));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        if (doc.data().senderId !== userId) {
            const seenBy = doc.data().seenBy || [];
            batch.update(doc.ref, { seenBy: [...seenBy, userId] });
        }
    });
    await batch.commit();
};


// --- Misc ---

export const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (typeof window === 'undefined' || !timestamp || typeof timestamp.seconds !== 'number') {
    return '';
  }
  try {
    const date = new Date(timestamp.seconds * 1000);
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
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
      }
    }
  } catch (e) {
    console.error("Error formatting timestamp:", e, "Original timestamp:", timestamp);
    return 'Invalid Date';
  }
};

export const formatLastSeen = (timestamp: Timestamp | null | undefined): string => {
    if (typeof window === 'undefined' || !timestamp || typeof timestamp.seconds !== 'number') {
        return '...';
    }
    const now = new Date();
    const lastSeenDate = new Date(timestamp.seconds * 1000);
    const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Online';
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays === 1) return `Active yesterday`;
    return `Active ${diffDays}d ago`;
};


export const mapChatToChatItem = (
    chat: Chat, 
    currentUserId: string,
): ChatItemProps => {
  const otherParticipantId = chat.participants.find(p => p !== currentUserId);
  
  if (!otherParticipantId) {
      return {
        id: chat.id!,
        name: 'Invalid Chat',
        contactUserId: '',
        lastMessage: 'Error: Could not load chat details.',
        timestamp: '',
        lastMessageTimestampValue: 0,
        href: `/chat/${chat.id}`,
      } as ChatItemProps;
  }
  
  const otherDetails = chat.participantDetails?.[otherParticipantId];

  const name = otherDetails?.name || 'Chat User';
  const avatarUrl = otherDetails?.avatarUrl;
  const isLastMessageSentByCurrentUser = chat.lastMessageSenderId === currentUserId;
  const onlineStatus = formatLastSeen(otherDetails?.lastSeen);
  const isOnline = onlineStatus === 'Online';
  const iconIdentifier = otherDetails?.isBot ? 'outline-bird-avatar' : undefined;

  return {
    id: chat.id!,
    name: name,
    contactUserId: otherParticipantId || '',
    avatarUrl: avatarUrl, 
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
    iconIdentifier: iconIdentifier, 
    isLastMessageSentByCurrentUser: isLastMessageSentByCurrentUser,
    isOnline: isOnline,
    onlineStatus: onlineStatus,
    onBlockUser: () => {},
    onUnblockUser: () => {},
    onDeleteChat: () => {},
    onViewProfile: () => {},
  };
};

export const getVerifiedUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isVerified', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

export const getNormalUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isVerified', '==', false), where('isBot', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

export const getVerifiedContactLimit = (vipPack?: string): number => {
    if (!vipPack) return 0;
    const pack = vipPack.toLowerCase();
    if (pack.includes('gold') || pack.includes('platinum') || pack.includes('diamond') || pack.includes('elite')) return 10;
    if (pack.includes('starter') || pack.includes('bronze') || pack.includes('silver')) return 5;
    if (pack.includes('micro') || pack.includes('mini') || pack.includes('basic')) return 3;
    return 0;
};


// --- Promo Codes ---

export interface VipPromoCode {
  code: string;
  durationDays: number;
  totalUses: number;
  usesPerUser: number;
  claimedBy: { [userId: string]: number };
  createdAt: number;
}
export interface PointsPromoCode {
    code: string;
    amount: number;
    totalUses: number;
    claimedBy: { [userId: string]: number };
    createdAt: number;
}
export interface BadgeGiftCode {
    type: 'badge_gift';
    code: string;
    badgeType: BadgeType;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    claimedBy: { [userId: string]: number };
    createdAt: number;
}

const generateRandomString = (length: number, characters: string): string => {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

export const createVipPromoCode = async (durationDays: number, totalUses: number, usesPerUser: number): Promise<string> => {
    const randomPart1 = generateRandomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const randomPart2 = generateRandomString(6, '0123456789');
    const code = `SAVE-${randomPart1}-${randomPart2}`;
    
    const newCodeRef = doc(collection(db, 'vip_promo_codes'));
    const newCode: Omit<VipPromoCode, 'code'> & { code: string } = {
        code,
        durationDays,
        totalUses,
        usesPerUser,
        claimedBy: {},
        createdAt: Date.now(),
    };
    await setDoc(doc(db, 'vip_promo_codes', code), newCode);
    return code;
};

export const redeemVipPromoCode = async (userId: string, code: string): Promise<{ success: boolean, durationDays: number }> => {
    const codeRef = doc(db, 'vip_promo_codes', code);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) throw new Error("Invalid promo code.");

    const promoCode = codeDoc.data() as VipPromoCode;
    const totalClaims = Object.values(promoCode.claimedBy || {}).reduce((sum, count) => sum + count, 0);

    if (totalClaims >= promoCode.totalUses) throw new Error("This promo code has reached its maximum number of uses.");

    const userClaims = promoCode.claimedBy[userId] || 0;
    if (userClaims >= promoCode.usesPerUser) throw new Error("You have already redeemed this promo code the maximum number of times.");
    
    await updateDocumentNonBlocking(codeRef, { [`claimedBy.${userId}`]: (userClaims + 1) });
    await updateUserProfile(userId, { 
        isVIP: true, 
        vipPack: `Promo (${promoCode.durationDays} days)`, 
        vipExpiryTimestamp: Date.now() + promoCode.durationDays * 24 * 60 * 60 * 1000 
    });

    return { success: true, durationDays: promoCode.durationDays };
};


export const createBadgeGiftCode = async (badgeType: BadgeType, durationDays: number, totalUses: number, usesPerUser: number): Promise<BadgeGiftCode> => {
    const randomPart1 = generateRandomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const randomPart2 = generateRandomString(6, '0123456789');
    const code = `GIFT-${randomPart1}-${randomPart2}`;

    const newCode: BadgeGiftCode = {
        type: 'badge_gift',
        code,
        badgeType,
        durationDays,
        totalUses,
        usesPerUser,
        claimedBy: {},
        createdAt: Date.now(),
    };
    await setDoc(doc(db, 'badge_gift_codes', code), newCode);
    return newCode;
};

export const redeemBadgeGiftCode = async (userId: string, code: string): Promise<{ success: true, badgeType: string, durationDays: number }> => {
    const codeRef = doc(db, 'badge_gift_codes', code);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) throw new Error("Invalid or expired gift code.");
    
    const giftCode = codeDoc.data() as BadgeGiftCode;
    const totalClaims = Object.values(giftCode.claimedBy || {}).reduce((sum, count) => sum + count, 0);
    if (totalClaims >= giftCode.totalUses) throw new Error("This gift code has reached its maximum number of uses.");
    
    const userClaims = (giftCode.claimedBy || {})[userId] || 0;
    if (userClaims >= giftCode.usesPerUser) throw new Error("You have already claimed this gift code the maximum number of times.");
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("User not found.");

    const badgeKey = `is${giftCode.badgeType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as keyof UserProfile;
    const expiryKey = `badgeExpiry.${giftCode.badgeType}`;
    
    const updateData: Partial<UserProfile> & { [key: string]: any } = { [badgeKey]: true };
    if (giftCode.durationDays !== Infinity) {
        updateData[expiryKey] = Date.now() + giftCode.durationDays * 24 * 60 * 60 * 1000;
    }
    
    await updateDocumentNonBlocking(userRef, updateData);
    await updateDocumentNonBlocking(codeRef, { [`claimedBy.${userId}`]: (userClaims + 1) });

    return { success: true, badgeType: giftCode.badgeType, durationDays: giftCode.durationDays };
};

export const createPointsPromoCode = async (amount: number, totalUses: number): Promise<string> => {
    const randomPart1 = generateRandomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const randomPart2 = generateRandomString(6, '0123456789');
    const code = `PTS-${randomPart1}-${randomPart2}`;

    const newCode: Omit<PointsPromoCode, 'code'> & { code: string } = {
        code,
        amount,
        totalUses,
        claimedBy: {},
        createdAt: Date.now(),
    };
    await setDoc(doc(db, 'points_promo_codes', code), newCode);
    return code;
};

export const redeemPointsPromoCode = async (userId: string, code: string): Promise<{ success: boolean; amount: number }> => {
    const codeRef = doc(db, 'points_promo_codes', code);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) throw new Error("Invalid points promo code.");

    const promoCode = codeDoc.data() as PointsPromoCode;
    const totalClaims = Object.values(promoCode.claimedBy || {}).length;

    if (totalClaims >= promoCode.totalUses) throw new Error("This promo code has reached its maximum uses.");
    if (promoCode.claimedBy[userId]) throw new Error("You have already redeemed this code.");
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("User not found.");

    await updateDocumentNonBlocking(codeRef, { [`claimedBy.${userId}`]: 1 });
    await updateDocumentNonBlocking(userRef, { points: (userDoc.data().points || 0) + promoCode.amount });

    return { success: true, amount: promoCode.amount };
};

export const getVipPromoCodes = async (): Promise<VipPromoCode[]> => {
    const snapshot = await getDocs(query(collection(db, 'vip_promo_codes'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => doc.data() as VipPromoCode);
};

export const getBadgeGiftCodes = async (): Promise<BadgeGiftCode[]> => {
    const snapshot = await getDocs(query(collection(db, 'badge_gift_codes'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => doc.data() as BadgeGiftCode);
};

export const getPointsPromoCodes = async (): Promise<PointsPromoCode[]> => {
    const snapshot = await getDocs(query(collection(db, 'points_promo_codes'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => doc.data() as PointsPromoCode);
};

export const deleteVipPromoCode = async (code: string): Promise<void> => {
    await deleteDocumentNonBlocking(doc(db, 'vip_promo_codes', code));
};

export const deleteBadgeGiftCode = async (code: string): Promise<void> => {
    await deleteDocumentNonBlocking(doc(db, 'badge_gift_codes', code));
};

export const deletePointsPromoCode = async (code: string): Promise<void> => {
    await deleteDocumentNonBlocking(doc(db, 'points_promo_codes', code));
};

export const giftPoints = async (fromUid: string, toUid: string, amount: number): Promise<void> => {
    const fromUserRef = doc(db, 'users', fromUid);
    const toUserRef = doc(db, 'users', toUid);

    const fromUserDoc = await getDoc(fromUserRef);
    const toUserDoc = await getDoc(toUserRef);

    if (!fromUserDoc.exists() || !toUserDoc.exists()) throw new Error("Sender or receiver not found.");
    if ((fromUserDoc.data().points || 0) < amount) throw new Error("Insufficient points.");
    
    const batch = writeBatch(db);
    batch.update(fromUserRef, { points: (fromUserDoc.data().points || 0) - amount });
    batch.update(toUserRef, { 
        points: (toUserDoc.data().points || 0) + amount,
        hasNewPointsGift: true,
        pointsGifterUid: fromUid,
        lastGiftedPointsAmount: amount,
    });
    
    await batch.commit();
};
