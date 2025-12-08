
// src/services/firestore.ts
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp,
    orderBy, limit, arrayUnion, arrayRemove, writeBatch, deleteDoc, Timestamp, deleteField,
    type DocumentData, type Unsubscribe
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase'; // Corrected import
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/types/user';
import type { ChatItemProps } from '@/components/chat/chat-item';
import type { BadgeType } from '@/app/(app)/layout';

const { firestore } = initializeFirebase();

export const BOT_UID = 'blue_bird_ai_uid';

// =================================================================
// LIVE FIRESTORE SERVICE FUNCTIONS
// =================================================================

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  isSentByCurrentUser?: boolean;
  isDeleted?: boolean;
  seenBy?: string[];
  replyingTo?: {
      id: string;
      senderName: string;
      textSnippet: string;
      wasAttachment: boolean;
      attachmentType?: string;
      attachmentName?: string;
      wasImage?: boolean;
  } | null;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'document' | 'other';
  audioDuration?: number;
  reactions?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
}

export interface Chat {
  id: string;
  participants: string[];
  createdAt?: Timestamp;
  lastMessage?: Message;
  participantProfiles: UserProfile[];
}

export interface Gift {
    id: string;
    senderId: string;
    receiverId: string;
    giftType: 'badge' | 'points' | 'feature_suggestion_approved';
    badgeType?: BadgeType;
    pointsAmount?: number;
    timestamp: Timestamp;
}

export interface FeatureSuggestion {
    id: string;
    suggesterUid: string;
    suggesterName: string;
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    status: 'submitted' | 'approved';
    createdAt: Timestamp;
}

const sendPushNotification = async (sender: UserProfile, recipient: UserProfile, messageText: string, chatId: string) => {
    if (!recipient.fcmTokens || recipient.fcmTokens.length === 0) {
        console.log(`Push notification not sent: Recipient ${recipient.name} has no FCM tokens.`);
        return;
    }

    // Check if user is online (last seen within last 5 minutes)
    const isOnline = recipient.lastSeen && (Date.now() - recipient.lastSeen.toDate().getTime()) < 5 * 60 * 1000;
    if (isOnline) {
        console.log(`Push notification not sent: Recipient ${recipient.name} is currently online.`);
        return;
    }

    const serverKey = process.env.NEXT_PUBLIC_FCM_SERVER_KEY;
    if (!serverKey) {
        console.error("Push notification not sent: NEXT_PUBLIC_FCM_SERVER_KEY is not set.");
        return;
    }

    const notificationPayload = {
        notification: {
            title: sender.name,
            body: messageText,
            icon: sender.avatarUrl || '/icon.png',
        },
        data: {
            url: `/chat/${sender.uid}`, // URL to open when notification is clicked
        },
    };
    
    console.log(`Sending push notification to ${recipient.name}'s ${recipient.fcmTokens.length} devices.`);

    for (const token of recipient.fcmTokens) {
        try {
            await fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Authorization': `key=${serverKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: token,
                    ...notificationPayload
                }),
            });
        } catch (error) {
            console.error(`Failed to send push notification to token ${token}:`, error);
        }
    }
};


export const mapChatToChatItem = async (chat: Chat, currentUserId: string): Promise<ChatItemProps> => {
    const partnerId = chat.participants.find(p => p !== currentUserId);
    if (!partnerId) {
      throw new Error(`Could not find a partner in chat ${chat.id}`);
    }
  
    const partnerProfile = chat.participantProfiles.find(p => p.uid === partnerId) || await getUserProfile(partnerId);
    if (!partnerProfile) {
        throw new Error(`Could not find profile for partner ${partnerId}`);
    }
  
    const lastMessage = chat.lastMessage;
    const lastMessageTimestamp = lastMessage?.timestamp ?? chat.createdAt ?? { toDate: () => new Date('2020-01-01T00:00:00Z'), seconds: 0, nanoseconds: 0 };
    
    // Defensive check to ensure toDate exists and is a function
    const hasValidTimestamp = lastMessageTimestamp && typeof lastMessageTimestamp.toDate === 'function';
    const date = hasValidTimestamp ? lastMessageTimestamp.toDate() : new Date('2020-01-01T00:00:00Z');

    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffDays = Math.floor(diffSeconds / 86400);

    let timestampStr = '';
    if (diffSeconds < 60) {
        timestampStr = 'Just now';
    } else if (diffSeconds < 3600) {
        timestampStr = `${Math.floor(diffSeconds / 60)}m`;
    } else if (diffSeconds < 86400) {
        timestampStr = `${Math.floor(diffSeconds / 3600)}h`;
    } else if (diffDays === 1) {
        timestampStr = 'Yesterday';
    } else if (diffDays < 7) {
        timestampStr = date.toLocaleDateString([], { weekday: 'short' });
    } else {
        timestampStr = date.toLocaleDateString();
    }
    
    const isOnline = partnerProfile.lastSeen && typeof partnerProfile.lastSeen.toDate === 'function'
      ? (new Date().getTime() - partnerProfile.lastSeen.toDate().getTime()) < 300000
      : false;

    return {
      id: chat.id,
      name: partnerProfile.name || 'Unknown User',
      contactUserId: partnerId,
      avatarUrl: partnerProfile.avatarUrl,
      lastMessage: lastMessage?.isDeleted ? 'Message deleted' : (lastMessage?.text || (lastMessage?.attachmentName ? `Attachment: ${lastMessage.attachmentName}` : 'No messages yet')),
      timestamp: timestampStr,
      lastMessageTimestampValue: hasValidTimestamp ? lastMessageTimestamp.seconds : 0,
      isVerified: partnerProfile.isVerified,
      isContactVIP: partnerProfile.isVIP,
      isDevTeam: partnerProfile.isDevTeam,
      isBot: partnerProfile.isBot,
      isCreator: partnerProfile.isCreator,
      isMemeCreator: partnerProfile.isMemeCreator,
      isBetaTester: partnerProfile.isBetaTester,
      badgeOrder: partnerProfile.badgeOrder,
      href: `/chat/${partnerId}`,
      iconIdentifier: partnerProfile.avatarUrl,
      isLastMessageSentByCurrentUser: lastMessage?.senderId === currentUserId,
      isOnline: isOnline,
      onBlockUser: () => {},
      onUnblockUser: () => {},
      onDeleteChat: () => {},
      onViewProfile: () => {},
    };
};

// ---------------------------------
// User Profile Functions
// ---------------------------------
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (uid === BOT_UID) {
    return { 
        uid: BOT_UID, 
        name: 'Blue Bird (AI Assistant)', 
        email: null, 
        avatarUrl: 'outline-bird-avatar',
        isBot: true,
        lastSeen: Timestamp.now(),
        fcmTokens: [],
    };
  }

  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

export const findUserByDisplayUid = async (displayUid: string): Promise<UserProfile | null> => {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where("displayUid", "==", displayUid), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
      return null;
  }
  return querySnapshot.docs[0].data() as UserProfile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    const updateData = {
        ...data,
        lastSeen: serverTimestamp()
    };
    updateDoc(userRef, updateData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
};

export const getNewestUsers = async (count: number): Promise<UserProfile[]> => {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

// ---------------------------------
// Chat and Message Functions
// ---------------------------------
export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void, onError: (error: Error) => void): Unsubscribe => {
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    }, (error) => {
        console.error("Error in getChatMessages snapshot:", error);
        onError(new FirestorePermissionError({ path: `chats/${chatId}/messages`, operation: 'list'}));
    });
};

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void, onError: (error: Error) => void): Unsubscribe => {
    const chatsRef = collection(firestore, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    
    return onSnapshot(q, async (querySnapshot) => {
        try {
            const chatsPromises = querySnapshot.docs.map(async (docSnap) => {
                const chatData = docSnap.data() as Omit<Chat, 'id' | 'participantProfiles'>;
                const participantProfiles = await Promise.all(
                    chatData.participants.map(uid => getUserProfile(uid))
                );

                return {
                    id: docSnap.id,
                    ...chatData,
                    participantProfiles: participantProfiles.filter((p): p is UserProfile => p !== null),
                } as Chat;
            });
            const chats = await Promise.all(chatsPromises);
            callback(chats);
        } catch (err) {
            onError(err as Error);
        }
    }, (error) => {
        console.error("Error in getUserChats snapshot:", error);
        onError(new FirestorePermissionError({ path: 'chats', operation: 'list'}));
    });
};

export const sendMessage = async (
    chatId: string, 
    senderId: string, 
    text: string, 
    attachmentData?: { dataUri: string, name: string, type: 'image' | 'video' | 'audio' | 'document' | 'other', duration?: number },
    replyingTo?: Message['replyingTo'],
    isBotMessage: boolean = false
): Promise<void> => {
    const senderProfile = await getUserProfile(senderId);
    if (!senderProfile) throw new Error("Sender profile not found.");

    const newMessageData: Omit<Message, 'id'> = {
        senderId,
        senderName: senderProfile.name,
        text,
        timestamp: serverTimestamp() as Timestamp,
        seenBy: [senderId],
        reactions: {},
        replyingTo: replyingTo || null,
        isDeleted: false,
    };

    if (attachmentData) {
        newMessageData.attachmentUrl = attachmentData.dataUri;
        newMessageData.attachmentName = attachmentData.name;
        newMessageData.attachmentType = attachmentData.type;
        if (attachmentData.type === 'audio') {
            newMessageData.audioDuration = attachmentData.duration;
        }
    }

    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const chatRef = doc(firestore, 'chats', chatId);

    const batch = writeBatch(firestore);
    const newMessageRef = doc(messagesRef); 

    batch.set(newMessageRef, newMessageData);
    batch.update(chatRef, { lastMessage: { ...newMessageData, id: newMessageRef.id } });

    await batch.commit().catch(error => {
        console.error("Error sending message:", error);
        const permissionError = new FirestorePermissionError({
            path: isBotMessage ? chatRef.path : newMessageRef.path,
            operation: 'write',
            requestResourceData: isBotMessage ? { lastMessage: newMessageData } : newMessageData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

    if (!isBotMessage) {
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data() as Chat;
      const recipientId = chatData.participants.find(p => p !== senderId);
      if (recipientId) {
        const recipientProfile = await getUserProfile(recipientId);
        if (recipientProfile) {
          const messageContent = text || `Sent an ${attachmentData?.type || 'attachment'}`;
          await sendPushNotification(senderProfile, recipientProfile, messageContent, chatId);
        }
      }
    }
};

export const findChatBetweenUsers = async (userId1: string, userId2: string): Promise<string | null> => {
    const chatsRef = collection(firestore, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId1));
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
        const participants = doc.data().participants as string[];
        if (participants.includes(userId2)) {
            return doc.id;
        }
    }
    return null;
};

export const createChat = async (userId1: string, userId2: string): Promise<string> => {
    const chatsRef = collection(firestore, 'chats');
    const newChatData = {
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
    };
    const newChatRef = await addDoc(chatsRef, newChatData)
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: chatsRef.path,
          operation: 'create',
          requestResourceData: newChatData
        }));
        throw error; // Re-throw to indicate failure
      });
    return newChatRef.id;
};

export const sendWelcomeMessage = async (userId: string) => {
    const botProfile = await getUserProfile(BOT_UID);
    if (!botProfile) {
        console.error("Bot profile not found. Cannot create welcome chat.");
        return;
    }
    const chatId = await createChat(userId, BOT_UID);
    if (!chatId) {
        console.error("Could not create chat with bot to send welcome message.");
        return;
    }
    await sendMessage(chatId, BOT_UID, "Welcome! I'm your AI assistant. How can I help you today? You can ask me about the app's features, get news updates, or even ask for a poem.", undefined, undefined, true);
};

export const deleteMessage = async (chatId: string, messageId: string) => {
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    const updateData = {
        text: "",
        attachmentUrl: null,
        attachmentName: null,
        attachmentType: null,
        isDeleted: true,
    };
    updateDoc(messageRef, updateData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messageRef.path,
            operation: 'update',
            requestResourceData: updateData
        }));
    });
};

export const toggleReaction = async (chatId: string, messageId: string, emoji: string, userId: string) => {
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    
    try {
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) return;

        const messageData = messageDoc.data() as Message;
        const reactions = messageData.reactions || {};
        const existingReaction = reactions[emoji];
        
        const batch = writeBatch(firestore);

        if (existingReaction && existingReaction.users.includes(userId)) {
            const newCount = existingReaction.count - 1;
            if (newCount === 0) {
                delete reactions[emoji];
            } else {
                reactions[emoji] = {
                    count: newCount,
                    users: existingReaction.users.filter(uid => uid !== userId),
                };
            }
        } else {
            if (existingReaction) {
                reactions[emoji].count++;
                reactions[emoji].users.push(userId);
            } else {
                reactions[emoji] = { count: 1, users: [userId] };
            }
        }

        batch.update(messageRef, { reactions });
        await batch.commit();

    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messageRef.path,
            operation: 'update',
            requestResourceData: { reactions: '...' } // Representational
        }));
    }
};

export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('seenBy', 'array-contains', userId), where('senderId', '!=', userId));
    const unseenMessagesQuery = query(messagesRef, where('senderId', '!=', userId));
    
    try {
        const querySnapshot = await getDocs(unseenMessagesQuery);
        const batch = writeBatch(firestore);
        let hasUpdates = false;
        querySnapshot.forEach(doc => {
            const message = doc.data() as Message;
            if (!message.seenBy || !message.seenBy.includes(userId)) {
                batch.update(doc.ref, { seenBy: arrayUnion(userId) });
                hasUpdates = true;
            }
        });
        if(hasUpdates) {
            await batch.commit();
        }
    } catch(error) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `chats/${chatId}/messages`,
            operation: 'list' // This is the likely failing operation
        }));
    }
};

// ---------------------------------
// Other Functions (VIP, Gifts, etc.)
// ---------------------------------
export const updateVIPStatus = async (uid: string, isVIP: boolean, vipPack?: string, durationDays?: number): Promise<void> => {
    let profileUpdate: Partial<UserProfile>;

    if (isVIP) {
        const expiryTimestamp = durationDays && durationDays !== Infinity
            ? Date.now() + durationDays * 24 * 60 * 60 * 1000
            : undefined;

        profileUpdate = {
            isVIP: true,
            vipPack: vipPack,
            vipExpiryTimestamp: expiryTimestamp,
        };
    } else {
        profileUpdate = {
            isVIP: false,
            vipPack: deleteField() as any,
            vipExpiryTimestamp: deleteField() as any,
        };
    }

    await updateUserProfile(uid, profileUpdate);
};

export const giftBadge = async (senderUid: string, recipientUid: string, badge: BadgeType, durationDays: number | null) => {
    const recipientRef = doc(firestore, 'users', recipientUid);
    
    const badgeKey = `is${badge.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof UserProfile;
    
    const expiryTimestamp = durationDays ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : null;

    const updateData = {
        [badgeKey]: true,
        hasNewGift: true,
        giftedByUid: senderUid,
        lastGiftedBadge: badge,
        [`badgeExpiry.${badge}`]: expiryTimestamp,
    };
    
    updateDoc(recipientRef, updateData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recipientRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
};


export const logGift = async (giftData: Omit<Gift, 'id' | 'timestamp'>) => {
    const giftWithTimestamp = {
        ...giftData,
        timestamp: serverTimestamp(),
    };
    const giftsRef = collection(firestore, 'users', giftData.receiverId, 'gifts');
    addDoc(giftsRef, giftWithTimestamp).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: giftsRef.path,
            operation: 'create',
            requestResourceData: giftWithTimestamp
        }));
    });
};

export const getGiftHistory = (userId: string, callback: (gifts: Gift[]) => void, onError: (error: Error) => void): Unsubscribe => {
    const giftsRef = collection(firestore, 'users', userId, 'gifts');
    const q = query(giftsRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, async (querySnapshot) => {
        const enrichedGifts = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const gift = { id: doc.id, ...doc.data() } as Gift;
            return gift;
        }));
        callback(enrichedGifts);
    }, (error) => {
        console.error("Error in getGiftHistory snapshot:", error);
        onError(new FirestorePermissionError({ path: `users/${userId}/gifts`, operation: 'list' }));
    });
};

export interface VipPromoCode {
    code: string;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    createdAt: number;
    claimedBy: { [uid: string]: number };
}
export interface PointsPromoCode {
    code: string;
    amount: number;
    totalUses: number;
    createdAt: number;
    claimedBy: { [uid: string]: number };
}
export interface BadgeGiftCode {
    type: 'badge_gift';
    code: string;
    badgeType: BadgeType;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    createdAt: number;
    claimedBy: { [uid: string]: number };
}

export const createVipPromoCode = async (durationDays: number, totalUses: number, usesPerUser: number): Promise<string> => {
    const code = `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newCode: VipPromoCode = { code, durationDays, totalUses, usesPerUser, createdAt: Date.now(), claimedBy: {} };
    await setDoc(doc(firestore, 'vipPromoCodes', code), newCode);
    return code;
}

export const redeemVipPromoCode = async (uid: string, code: string): Promise<{ durationDays: number }> => {
    const promoRef = doc(firestore, 'vipPromoCodes', code);
    const promoSnap = await getDoc(promoRef);
    if(!promoSnap.exists()) throw new Error("Invalid or expired promo code.");
    const promo = promoSnap.data() as VipPromoCode;

    if(Object.keys(promo.claimedBy).length >= promo.totalUses) throw new Error("Promo code has reached its maximum uses.");
    if((promo.claimedBy[uid] || 0) >= promo.usesPerUser) throw new Error("You have already redeemed this code the maximum number of times.");
    
    await updateDoc(promoRef, { [`claimedBy.${uid}`]: (promo.claimedBy[uid] || 0) + 1 });
    return { durationDays: promo.durationDays };
}

export const createPointsPromoCode = async (amount: number, totalUses: number): Promise<string> => {
    const code = `PTS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newCode: PointsPromoCode = { code, amount, totalUses, createdAt: Date.now(), claimedBy: {} };
    await setDoc(doc(firestore, 'pointsPromoCodes', code), newCode);
    return code;
}

export const redeemPointsPromoCode = async (uid: string, code: string): Promise<{ amount: number }> => {
    const promoRef = doc(firestore, 'pointsPromoCodes', code);
    const promoSnap = await getDoc(promoRef);
    if(!promoSnap.exists()) throw new Error("Invalid or expired promo code.");
    const promo = promoSnap.data() as PointsPromoCode;

    if(Object.keys(promo.claimedBy).length >= promo.totalUses) throw new Error("Promo code has reached its maximum uses.");
    
    const userProfile = await getUserProfile(uid);
    if(userProfile) {
      await updateUserProfile(uid, { points: (userProfile.points || 0) + promo.amount });
      await updateDoc(promoRef, { [`claimedBy.${uid}`]: (promo.claimedBy[uid] || 0) + 1 });
    }
    return { amount: promo.amount };
};

export const createBadgeGiftCode = async (badgeType: BadgeType, durationDays: number, totalUses: number, usesPerUser: number): Promise<BadgeGiftCode> => {
    const code = `BDG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newCode: BadgeGiftCode = { type: 'badge_gift', code, badgeType, durationDays, totalUses, usesPerUser, createdAt: Date.now(), claimedBy: {} };
    await setDoc(doc(firestore, 'badgeGiftCodes', code), newCode);
    return newCode;
};

export const redeemBadgeGiftCode = async (uid: string, code: string): Promise<{ badgeType: BadgeType; durationDays: number; }> => {
    const promoRef = doc(firestore, 'badgeGiftCodes', code);
    const promoSnap = await getDoc(promoRef);
    if(!promoSnap.exists()) throw new Error("Invalid or expired gift code.");
    const promo = promoSnap.data() as BadgeGiftCode;
    
    if (Object.keys(promo.claimedBy).length >= promo.totalUses) throw new Error("Gift code has reached its maximum uses.");
    if((promo.claimedBy[uid] || 0) >= promo.usesPerUser) throw new Error("You have already used this gift code.");
    
    const userProfile = await getUserProfile(uid);
    if (userProfile) {
        const badgeKey = `is${promo.badgeType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof UserProfile;
        const expiryTimestamp = Date.now() + promo.durationDays * 24 * 60 * 60 * 1000;
        await updateUserProfile(uid, { 
            [badgeKey]: true,
            badgeExpiry: {
                ...userProfile.badgeExpiry,
                [promo.badgeType]: expiryTimestamp,
            },
        });
        await updateDoc(promoRef, { [`claimedBy.${uid}`]: (promo.claimedBy[uid] || 0) + 1 });
    }
    return { badgeType: promo.badgeType, durationDays: promo.durationDays };
};

export const getVipPromoCodes = async (): Promise<VipPromoCode[]> => {
  const snapshot = await getDocs(collection(firestore, 'vipPromoCodes'));
  return snapshot.docs.map(doc => doc.data() as VipPromoCode).sort((a, b) => a.createdAt - b.createdAt);
}
export const getPointsPromoCodes = async (): Promise<PointsPromoCode[]> => {
    const snapshot = await getDocs(collection(firestore, 'pointsPromoCodes'));
    return snapshot.docs.map(doc => doc.data() as PointsPromoCode).sort((a, b) => a.createdAt - b.createdAt);
}

export const getBadgeGiftCodes = async (): Promise<BadgeGiftCode[]> => {
    const snapshot = await getDocs(collection(firestore, 'badgeGiftCodes'));
    return snapshot.docs.map(doc => doc.data() as BadgeGiftCode).sort((a,b) => a.createdAt - b.createdAt);
}

export const deleteVipPromoCode = async (code: string) => {
    await deleteDoc(doc(firestore, 'vipPromoCodes', code));
}

export const deletePointsPromoCode = async (code: string) => {
    await deleteDoc(doc(firestore, 'pointsPromoCodes', code));
}

export const deleteBadgeGiftCode = async (code: string) => {
    await deleteDoc(doc(firestore, 'badgeGiftCodes', code));
}

export const giftPoints = async (senderUid: string, recipientUid: string, amount: number) => {
    const senderRef = doc(firestore, 'users', senderUid);
    const recipientRef = doc(firestore, 'users', recipientUid);
    const batch = writeBatch(firestore);

    const senderSnap = await getDoc(senderRef);
    if (!senderSnap.exists()) throw new Error("Sender not found.");
    const sender = senderSnap.data() as UserProfile;
    if ((sender.points || 0) < amount) throw new Error("Insufficient points.");

    batch.update(senderRef, { points: (sender.points || 0) - amount });

    const recipientSnap = await getDoc(recipientRef);
    if (!recipientSnap.exists()) throw new Error("Recipient not found.");
    const recipient = recipientSnap.data() as UserProfile;

    batch.update(recipientRef, { 
        points: (recipient.points || 0) + amount,
        hasNewPointsGift: true,
        pointsGifterUid: senderUid,
        lastGiftedPointsAmount: amount,
    });
    
    await batch.commit().catch(error => {
        console.error("Batch write failed in giftPoints:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${recipientUid}`,
            operation: 'update',
            requestResourceData: { 
                points: (recipient.points || 0) + amount,
                hasNewPointsGift: true,
                pointsGifterUid: senderUid,
                lastGiftedPointsAmount: amount
            }
        }));
        throw new Error("Failed to commit points transaction due to permissions.");
    });
}

export const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatLastSeen = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return "Offline";
    
    const now = new Date();
    const lastSeenDate = timestamp.toDate();
    const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

    if (diffSeconds < 60) return "Online";
    if (diffSeconds < 3600) return `Last seen ${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `Last seen ${Math.floor(diffSeconds / 3600)}h ago`;
    return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
};

export const getVerifiedUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('isVerified', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

// Feature Suggestions
export const submitFeatureSuggestion = async (data: Omit<FeatureSuggestion, 'id' | 'createdAt' | 'status'>) => {
    const suggestionsRef = collection(firestore, 'feature_suggestions');
    const newSuggestion = {
        ...data,
        status: 'submitted',
        createdAt: serverTimestamp(),
    };
    addDoc(suggestionsRef, newSuggestion).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'feature_suggestions',
            operation: 'create',
            requestResourceData: newSuggestion,
        }));
        throw error;
    });
};

export const getFeatureSuggestions = async (): Promise<FeatureSuggestion[]> => {
    const suggestionsRef = collection(firestore, 'feature_suggestions');
    const q = query(suggestionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeatureSuggestion));
};

export const updateUserSuggestionStatus = async (suggestionId: string, status: 'approved') => {
    const suggestionRef = doc(firestore, 'feature_suggestions', suggestionId);
    return await updateDoc(suggestionRef, { status });
};

export const grantCreatorBadge = async (userId: string, devId: string) => {
    const userRef = doc(firestore, 'users', userId);
    const updateData = {
        isCreator: true,
        hasNewGift: true,
        lastGiftedBadge: 'creator' as BadgeType,
        giftedByUid: devId,
    };
    return await updateDoc(userRef, updateData);
};
