
// src/services/firestore.ts
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp,
    orderBy, limit, arrayUnion, arrayRemove, writeBatch, deleteDoc,
    type DocumentData, type Timestamp, type Firestore, type Unsubscribe
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { produce } from 'immer';
import type { UserProfile } from '@/types/user';
import type { ChatItemProps } from '@/components/chat/chat-item';
import { addNotification } from './notificationService';
import type { BadgeType } from '@/app/(app)/layout';

// =================================================================
// MOCK DATA (used when Firebase is not configured)
// =================================================================

export const DEV_UID = 'dev_team_uid';
export const BOT_UID = 'blue_bird_ai_uid';

const MOCK_CURRENT_USER_ID = 'user1'; // Let's assume user1 is our logged-in user

const createMockTimestamp = (date: string): Timestamp => {
    const d = new Date(date);
    return {
        seconds: Math.floor(d.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => d,
    } as Timestamp;
};

let mockUserProfiles: UserProfile[] = [
    { uid: MOCK_CURRENT_USER_ID, name: 'You', email: 'you@test.com', avatarUrl: 'https://picsum.photos/seed/user1/200', points: 1250, isVIP: true, vipPack: 'Gold', vipExpiryTimestamp: Date.now() + 86400000 * 30, createdAt: createMockTimestamp('2024-07-01T10:00:00Z'), isVerified: true, isCreator: false, hasCompletedOnboarding: true, lastSeen: serverTimestamp() as Timestamp, displayUid: '12345678', blockedUsers: [], selectedVerifiedContacts: ['user3'], hasMadeVipSelection: true, badgeOrder: ['verified', 'vip'], chatColorPreferences: { 'chat2': 'red' } },
    { uid: 'user2', name: 'Alice', email: 'alice@test.com', avatarUrl: 'https://picsum.photos/seed/user2/200', points: 500, createdAt: createMockTimestamp('2024-07-02T11:00:00Z'), isVerified: false, hasCompletedOnboarding: true, lastSeen: createMockTimestamp('2024-07-30T10:00:00Z'), displayUid: '87654321', blockedUsers: [], selectedVerifiedContacts: [], hasMadeVipSelection: false },
    { uid: 'user3', name: 'Bob (Verified)', email: 'bob@test.com', avatarUrl: 'https://picsum.photos/seed/user3/200', points: 2000, isVerified: true, isCreator: false, createdAt: createMockTimestamp('2024-06-15T09:00:00Z'), hasCompletedOnboarding: true, lastSeen: serverTimestamp() as Timestamp, displayUid: '11223344', blockedUsers: [], selectedVerifiedContacts: [], hasMadeVipSelection: false },
    { uid: 'user4', name: 'Charlie (Creator)', email: 'charlie@test.com', avatarUrl: 'https://picsum.photos/seed/user4/200', points: 10000, isCreator: true, isVerified: true, createdAt: createMockTimestamp('2024-05-20T14:00:00Z'), hasCompletedOnboarding: true, lastSeen: createMockTimestamp('2024-07-29T18:30:00Z'), displayUid: '55667788', blockedUsers: [], selectedVerifiedContacts: [], hasMadeVipSelection: false },
    { uid: BOT_UID, name: 'Blue Bird (AI Assistant)', isBot: true, email: 'bot@echo.app', avatarUrl: 'outline-bird-avatar', lastSeen: serverTimestamp() as Timestamp },
    { uid: DEV_UID, name: 'Dev Team', isDevTeam: true, email: 'dev@echo.app', avatarUrl: 'dev-team-svg-placeholder', lastSeen: serverTimestamp() as Timestamp },
    { uid: 'user5', name: 'David', email: 'david@test.com', avatarUrl: 'https://picsum.photos/seed/user5/200', points: 100, createdAt: createMockTimestamp('2024-07-25T12:00:00Z'), isVerified: false, hasCompletedOnboarding: true, lastSeen: createMockTimestamp('2024-07-28T15:00:00Z'), displayUid: '99887766', blockedUsers: [], selectedVerifiedContacts: [], hasMadeVipSelection: false },
];

export interface Chat {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTimestamp: Timestamp;
    lastMessageSenderId?: string;
    seenBy?: string[];
}

export let mockChats: Chat[] = [
    { id: 'chat1', participants: [MOCK_CURRENT_USER_ID, 'user2'], lastMessage: 'See you tomorrow!', lastMessageTimestamp: createMockTimestamp('2024-07-30T10:05:00Z'), lastMessageSenderId: MOCK_CURRENT_USER_ID, seenBy: [MOCK_CURRENT_USER_ID] },
    { id: 'chat2', participants: [MOCK_CURRENT_USER_ID, 'user3'], lastMessage: 'Thanks for the info!', lastMessageTimestamp: createMockTimestamp('2024-07-30T09:40:00Z'), lastMessageSenderId: 'user3', seenBy: [] },
    { id: 'chat3', participants: [MOCK_CURRENT_USER_ID, 'user4'], lastMessage: 'That project sounds exciting!', lastMessageTimestamp: createMockTimestamp('2024-07-29T18:35:00Z'), lastMessageSenderId: 'user4', seenBy: [MOCK_CURRENT_USER_ID] },
    { id: 'chat_bot', participants: [MOCK_CURRENT_USER_ID, BOT_UID], lastMessage: 'How can I help you explore the app?', lastMessageTimestamp: createMockTimestamp('2024-07-30T11:00:00Z'), lastMessageSenderId: BOT_UID, seenBy: [MOCK_CURRENT_USER_ID] },
    { id: 'chat_dev', participants: [MOCK_CURRENT_USER_ID, DEV_UID], lastMessage: 'Thank you for your feedback.', lastMessageTimestamp: createMockTimestamp('2024-07-28T16:00:00Z'), lastMessageSenderId: DEV_UID, seenBy: [MOCK_CURRENT_USER_ID] },
];

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  isSentByCurrentUser?: boolean;
  seenBy?: string[];
  reactions?: { [emoji: string]: { count: number; uids: string[] } };
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'video' | 'document' | 'audio' | 'other';
  audioDuration?: number;
  replyingTo?: {
      id: string;
      senderName: string;
      textSnippet: string;
      wasAttachment: boolean;
      attachmentType?: string;
      attachmentName?: string;
      wasImage: boolean;
  } | null;
  isDeleted?: boolean;
}

let mockMessages: { [chatId: string]: Message[] } = {
    'chat1': [
        { id: 'msg1-1', senderId: 'user2', senderName: 'Alice', text: 'Hey, how are you?', timestamp: createMockTimestamp('2024-07-30T10:00:00Z'), seenBy: [MOCK_CURRENT_USER_ID]},
        { id: 'msg1-2', senderId: MOCK_CURRENT_USER_ID, senderName: 'You', text: 'I\'m good, thanks! How about you?', timestamp: createMockTimestamp('2024-07-30T10:01:00Z'), seenBy: [] },
        { id: 'msg1-3', senderId: 'user2', senderName: 'Alice', text: 'Doing well. Are we still on for lunch tomorrow?', timestamp: createMockTimestamp('2024-07-30T10:02:00Z'), seenBy: [] },
        { id: 'msg1-4', senderId: MOCK_CURRENT_USER_ID, senderName: 'You', text: 'Absolutely! 12:30 at The Corner Cafe.', timestamp: createMockTimestamp('2024-07-30T10:03:00Z'), seenBy: [] },
        { id: 'msg1-5', senderId: 'user2', senderName: 'Alice', text: 'Perfect!', timestamp: createMockTimestamp('2024-07-30T10:04:00Z'), seenBy: [] },
        { id: 'msg1-6', senderId: MOCK_CURRENT_USER_ID, senderName: 'You', text: 'See you tomorrow!', timestamp: createMockTimestamp('2024-07-30T10:05:00Z'), reactions: {'👍': {count: 1, uids:['user2']}}, seenBy: [] },
    ],
    'chat_bot': [
        { id: 'msg_bot_1', senderId: BOT_UID, senderName: 'Blue Bird', text: 'Welcome to Echo Message! I\'m your personal AI assistant. Feel free to ask me anything about the app\'s features, your account, or just chat. How can I help you today?', timestamp: createMockTimestamp('2024-07-30T11:00:00Z'), seenBy: [MOCK_CURRENT_USER_ID]},
    ],
    'chat_dev': [
        { id: 'msg_dev_1', senderId: DEV_UID, senderName: 'Dev Team', text: 'Welcome to the developer feedback channel. Please report any bugs or suggest new features here. Your input is valuable to us.', timestamp: createMockTimestamp('2024-07-28T15:59:00Z'), seenBy: [MOCK_CURRENT_USER_ID]},
         { id: 'msg_dev_2', senderId: DEV_UID, senderName: 'Dev Team', text: 'Thank you for your feedback.', timestamp: createMockTimestamp('2024-07-28T16:00:00Z'), seenBy: [MOCK_CURRENT_USER_ID]},
    ]
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

const isFirebaseEnabled = () => !!firestore;

export const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return date.toLocaleDateString(undefined, { weekday: 'short' });

    return date.toLocaleDateString();
};


export const formatLastSeen = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'Offline';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMillis = now.getTime() - date.getTime();
    const diffSeconds = diffMillis / 1000;
    const diffMinutes = diffSeconds / 60;
    
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `Last seen ${Math.floor(diffMinutes)}m ago`;
    if (diffMinutes < 1440) return `Last seen ${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 2880) return 'Last seen yesterday';
    
    return `Last seen ${date.toLocaleDateString()}`;
};


// =================================================================
// USER PROFILE FUNCTIONS
// =================================================================

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseEnabled()) {
    console.log(`[Mock] getUserProfile for uid: ${uid}`);
    return mockUserProfiles.find(p => p.uid === uid) || null;
  }
  try {
    const userDocRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile for ${uid}:`, error);
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
    if (!isFirebaseEnabled()) {
        console.log(`[Mock] findUserByEmail for email: ${email}`);
        return mockUserProfiles.find(p => p.email === email) || null;
    }
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error(`Error finding user by email ${email}:`, error);
        throw error;
    }
};

export const getNormalUsers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseEnabled()) {
        console.log("[Mock] getNormalUsers");
        return mockUserProfiles.filter(u => 
            !u.isBot && 
            !u.isDevTeam && 
            !u.isCreator && 
            !u.isVerified
        );
    }
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, 
            where('isVerified', '==', false),
            where('isCreator', '==', false),
            where('isDevTeam', '==', false),
            where('isBot', '==', false)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (e) {
        console.error("Error getting normal users: ", e);
        return [];
    }
}

export const getAllGiftableUsers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseEnabled()) {
        console.log("[Mock] getAllGiftableUsers");
        return mockUserProfiles.filter(u => !u.isBot && !u.isDevTeam);
    }
    try {
        const usersRef = collection(firestore, 'users');
        // Fetch users who are not part of the dev team and are not bots.
        const q = query(usersRef, 
            where('isDevTeam', '==', false),
            where('isBot', '==', false)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (e) {
        console.error("Error getting all giftable users: ", e);
        // Fallback to a broader query if the composite query fails without an index.
        try {
            const usersRef = collection(firestore, 'users');
            const querySnapshot = await getDocs(usersRef);
            return querySnapshot.docs
                .map(doc => doc.data() as UserProfile)
                .filter(u => !u.isDevTeam && !u.isBot);
        } catch (fallbackError) {
             console.error("Fallback query for users also failed: ", fallbackError);
             return [];
        }
    }
}


export const getVerifiedUsers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseEnabled()) {
        return mockUserProfiles.filter(u => u.isVerified || u.isCreator);
    }
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('isVerified', '==', true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (e) {
        console.error("Error getting verified users: ", e);
        return [];
    }
};


export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!isFirebaseEnabled()) {
        mockUserProfiles = produce(mockUserProfiles, draft => {
            const userIndex = draft.findIndex(p => p.uid === uid);
            if (userIndex !== -1) {
                draft[userIndex] = { ...draft[userIndex], ...data };
            }
        });
        console.log(`[Mock] updateUserProfile for ${uid} with`, data);
        return;
    }
    try {
        const userDocRef = doc(firestore, 'users', uid);
        await updateDoc(userDocRef, data);
    } catch (error) {
        console.error(`Error updating user profile for ${uid}:`, error);
        throw error;
    }
};

// =================================================================
// CHAT FUNCTIONS
// =================================================================

export const getUserChats = (userId: string, onUpdate: (chats: Chat[]) => void, onError: (error: Error) => void): Unsubscribe => {
    if (!isFirebaseEnabled()) {
        console.log(`[Mock] getUserChats for uid: ${userId}`);
        const userChats = mockChats.filter(c => c.participants.includes(userId));
        setTimeout(() => onUpdate(userChats), 100);
        return () => console.log("[Mock] Unsubscribed from user chats.");
    }
    
    try {
        const chatsRef = collection(firestore, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', userId), orderBy('lastMessageTimestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
            onUpdate(chats);
        }, (error) => {
            console.error(`Error getting chats for user ${userId}:`, error);
            onError(error);
        });

        return unsubscribe;

    } catch (error) {
        console.error(`Error setting up chat subscription for user ${userId}:`, error);
        onError(error as Error);
        return () => {}; // Return a no-op unsubscribe function on initial error
    }
};

export const createChat = async (creatorId: string, partnerId: string): Promise<string> => {
    if (!isFirebaseEnabled()) {
        const newChatId = `chat_${Date.now()}`;
        const newChat: Chat = {
            id: newChatId,
            participants: [creatorId, partnerId],
            lastMessage: 'Chat created.',
            lastMessageTimestamp: serverTimestamp() as Timestamp,
            seenBy: [],
        };
        mockChats.push(newChat);
        console.log(`[Mock] createChat between ${creatorId} and ${partnerId}. New chat ID: ${newChatId}`);
        return newChatId;
    }
    try {
        const newChatDoc = doc(collection(firestore, 'chats'));
        const newChatId = newChatDoc.id;

        await setDoc(newChatDoc, {
            participants: [creatorId, partnerId],
            createdAt: serverTimestamp(),
            lastMessage: "Chat created",
            lastMessageTimestamp: serverTimestamp(),
            seenBy: [],
        });
        
        return newChatId;
    } catch (error) {
        console.error(`Error creating chat between ${creatorId} and ${partnerId}:`, error);
        throw error;
    }
};

export const findChatBetweenUsers = async (userId1: string, userId2: string): Promise<string | null> => {
    if (!isFirebaseEnabled()) {
        console.log(`[Mock] findChatBetweenUsers for ${userId1} and ${userId2}`);
        const chat = mockChats.find(c => c.participants.includes(userId1) && c.participants.includes(userId2));
        return chat ? chat.id : null;
    }

    try {
        const chatsRef = collection(firestore, "chats");
        const q = query(chatsRef, 
            where('participants', '==', [userId1, userId2].sort())
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        // Check the other permutation
         const q2 = query(chatsRef, 
            where('participants', '==', [userId2, userId1].sort())
        );
        const querySnapshot2 = await getDocs(q2);
        if (!querySnapshot2.empty) {
            return querySnapshot2.docs[0].id;
        }

        return null;

    } catch (error) {
        console.error(`Error finding chat between ${userId1} and ${userId2}:`, error);
        throw error;
    }
};


export const mapChatToChatItem = async (chat: Chat, currentUserId: string): Promise<ChatItemProps> => {
    const partnerId = chat.participants.find(p => p !== currentUserId) || '';
    const partnerProfile = await getUserProfile(partnerId);
    
    return {
        id: chat.id,
        contactUserId: partnerId,
        name: partnerProfile?.name || 'Unknown User',
        avatarUrl: partnerProfile?.avatarUrl,
        lastMessage: chat.lastMessage,
        timestamp: formatTimestamp(chat.lastMessageTimestamp),
        lastMessageTimestampValue: chat.lastMessageTimestamp?.seconds || 0,
        isVerified: partnerProfile?.isVerified,
        isContactVIP: partnerProfile?.isVIP,
        isDevTeam: partnerProfile?.isDevTeam,
        isBot: partnerProfile?.isBot,
        isCreator: partnerProfile?.isCreator,
        isMemeCreator: partnerProfile?.isMemeCreator,
        isBetaTester: partnerProfile?.isBetaTester,
        badgeOrder: partnerProfile?.badgeOrder,
        iconIdentifier: partnerProfile?.isBot ? 'outline-bird-avatar' : (partnerProfile?.isDevTeam ? 'dev-team-svg' : undefined),
        isLastMessageSentByCurrentUser: chat.lastMessageSenderId === currentUserId,
        isOnline: partnerProfile?.lastSeen ? (partnerProfile.lastSeen.toDate().getTime() > Date.now() - 5 * 60 * 1000) : false,
        href: `/chat/${partnerId}`, // Use partner ID for navigation
        onBlockUser: () => {},
        onUnblockUser: () => {},
        onDeleteChat: () => {},
        onViewProfile: () => {},
    };
};

export const sendWelcomeMessage = async (userId: string) => {
    if (!isFirebaseEnabled()) {
        const botChatId = `chat_bot`;
        if (!mockMessages[botChatId]) mockMessages[botChatId] = [];
        mockMessages[botChatId].push({
            id: `msg_bot_welcome_${Date.now()}`,
            senderId: BOT_UID,
            senderName: 'Blue Bird',
            text: 'Welcome to Echo Message! I\'m your personal AI assistant. Feel free to ask me anything about the app\'s features, your account, or just chat. How can I help you today?',
            timestamp: serverTimestamp() as Timestamp,
            seenBy: []
        });

        const devChatId = `chat_dev`;
         if (!mockMessages[devChatId]) mockMessages[devChatId] = [];
        mockMessages[devChatId].push({
             id: `msg_dev_welcome_${Date.now()}`,
             senderId: DEV_UID,
             senderName: 'Dev Team',
             text: 'Welcome to the developer feedback channel. Please report any bugs or suggest new features here. Your input is valuable to us.',
             timestamp: serverTimestamp() as Timestamp,
             seenBy: [],
        });
        
        return;
    }

    try {
        // This function would be more robust on a server,
        // but for client-side it ensures the user has these chats.
        const botChatRef = doc(firestore, "chats", "chat_bot");
        await updateDoc(botChatRef, { participants: arrayUnion(userId) });

        const devChatRef = doc(firestore, "chats", "dev_team");
        await updateDoc(devChatRef, { participants: arrayUnion(userId) });
        
        // Don't add messages here, as a server function would handle that
        // to avoid race conditions and duplicated messages.

    } catch (error) {
        console.error("Error ensuring user is in welcome chats:", error);
    }
};

// =================================================================
// MESSAGE FUNCTIONS
// =================================================================

export const getChatMessages = (chatId: string, onUpdate: (messages: Message[]) => void, onError: (error: Error) => void): Unsubscribe => {
    if (!isFirebaseEnabled()) {
        console.log(`[Mock] getChatMessages for chatId: ${chatId}`);
        const messages = mockMessages[chatId] || [];
        setTimeout(() => onUpdate(messages), 50);
        return () => console.log("[Mock] Unsubscribed from chat messages.");
    }

    let unsubscribe: Unsubscribe = () => {};

    const startListener = async () => {
        try {
            const chatDocRef = doc(firestore, 'chats', chatId);
            const chatDoc = await getDoc(chatDocRef);

            if (!chatDoc.exists()) {
                console.warn(`Chat document ${chatId} does not exist yet. Not fetching messages.`);
                onUpdate([]); 
                return; // Stop here, no need to return an unsubscribe function
            }

            const messagesRef = collection(firestore, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                onUpdate(messages);
            }, (error) => {
                console.error(`Error getting messages for chat ${chatId}:`, error);
                onError(error);
            });

        } catch (error) {
            console.error(`Error setting up message subscription for chat ${chatId}:`, error);
            onError(error as Error);
        }
    };

    startListener();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
};


export const sendMessage = async (
    chatId: string, 
    senderId: string, 
    text: string, 
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number },
    replyingTo?: Message['replyingTo'] | null,
    isBotMessage: boolean = false,
): Promise<void> => {

    const senderProfile = await getUserProfile(senderId);
    const senderName = senderProfile?.name || 'User';

    const newMessage: Omit<Message, 'id' | 'timestamp'> & { timestamp: Timestamp } = {
        senderId,
        senderName,
        text,
        timestamp: serverTimestamp() as Timestamp,
        replyingTo: replyingTo || null,
        reactions: {},
        seenBy: [senderId],
    };
    if (attachmentData) {
        newMessage.attachmentUrl = attachmentData.dataUri;
        newMessage.attachmentName = attachmentData.name;
        newMessage.attachmentType = attachmentData.type;
        newMessage.audioDuration = attachmentData.duration;
    }
    
    if (!isFirebaseEnabled()) {
        const fullMessage: Message = {
            ...newMessage,
            id: `msg_${Date.now()}`,
        };
        if (!mockMessages[chatId]) mockMessages[chatId] = [];
        mockMessages[chatId].push(fullMessage);
        const chatIndex = mockChats.findIndex(c => c.id === chatId);
        if (chatIndex > -1) {
            mockChats[chatIndex].lastMessage = text || attachmentData?.name || 'Attachment';
            mockChats[chatIndex].lastMessageTimestamp = fullMessage.timestamp;
            mockChats[chatIndex].lastMessageSenderId = senderId;
        }
        console.log(`[Mock] sendMessage in chat ${chatId}: ${text}`);
        return;
    }

    try {
        const chatRef = doc(firestore, 'chats', chatId);
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        const batch = writeBatch(firestore);

        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
             // This is the first message, so we create the chat document.
             const partnerId = chatId.replace(senderId, '').replace('_', '');
             batch.set(chatRef, {
                 participants: [senderId, partnerId].sort(),
                 createdAt: serverTimestamp(),
             });
        }
        
        batch.set(doc(messagesRef), newMessage);
        
        batch.update(chatRef, {
            lastMessage: text || attachmentData?.name || 'Attachment',
            lastMessageTimestamp: newMessage.timestamp,
            lastMessageSenderId: senderId,
            seenBy: [senderId]
        });

        await batch.commit();

        if (!isBotMessage) {
            const chatData = chatDoc.data();
            if (chatData) {
                const recipients = chatData.participants.filter((p: string) => p !== senderId);
                recipients.forEach((recipientId: string) => {
                    addNotification({
                        type: 'new_message',
                        title: `New message from ${senderName}`,
                        message: text || `Sent an attachment.`,
                        relatedData: { chatId, senderId }
                    });
                });
            }
        }


    } catch (error) {
        console.error(`Error sending message in chat ${chatId}:`, error);
        throw error;
    }
};

export const deleteMessage = async (chatId: string, messageId: string): Promise<void> => {
    if (!isFirebaseEnabled()) {
        const chatMessages = mockMessages[chatId];
        if (chatMessages) {
            const msgIndex = chatMessages.findIndex(m => m.id === messageId);
            if (msgIndex !== -1) {
                mockMessages[chatId][msgIndex] = { ...mockMessages[chatId][msgIndex], isDeleted: true, text: '' };
            }
        }
        console.log(`[Mock] deleteMessage ${messageId} in chat ${chatId}`);
        return;
    }
     try {
        const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: "",
            attachmentUrl: null,
            attachmentName: null,
            attachmentType: null,
            isDeleted: true,
            reactions: {},
            replyingTo: null,
        });
    } catch (error) {
        console.error(`Error deleting message ${messageId} from chat ${chatId}:`, error);
        throw error;
    }
};

export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
    if (!isFirebaseEnabled()) {
        return;
    }
    try {
        const chatRef = doc(firestore, 'chats', chatId);
        await updateDoc(chatRef, {
            seenBy: arrayUnion(userId)
        });
    } catch (error) {
        console.error(`Error marking messages as seen for user ${userId} in chat ${chatId}:`, error);
    }
}

export const toggleReaction = async (chatId: string, messageId: string, emoji: string, userId: string): Promise<void> => {
    if (!isFirebaseEnabled()) {
        const msg = mockMessages[chatId]?.find(m => m.id === messageId);
        if (msg) {
            if (!msg.reactions) msg.reactions = {};
            const reaction = msg.reactions[emoji];
            if (reaction && reaction.uids.includes(userId)) {
                reaction.count--;
                reaction.uids = reaction.uids.filter(uid => uid !== userId);
            } else {
                if (!reaction) msg.reactions[emoji] = { count: 0, uids: [] };
                msg.reactions[emoji].count++;
                msg.reactions[emoji].uids.push(userId);
            }
        }
        console.log(`[Mock] toggleReaction ${emoji} for message ${messageId} by ${userId}`);
        return;
    }

    try {
        const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) return;

        const messageData = messageDoc.data();
        const reactions = messageData.reactions || {};
        const reactionData = reactions[emoji] || { count: 0, uids: [] };

        const userIndex = reactionData.uids.indexOf(userId);
        
        let newCount = reactionData.count;
        let newUids = [...reactionData.uids];

        if (userIndex > -1) { // User is removing their reaction
            newCount--;
            newUids.splice(userIndex, 1);
        } else { // User is adding a reaction
            newCount++;
            newUids.push(userId);
        }

        const newReactions = {
            ...reactions,
            [emoji]: {
                count: newCount,
                uids: newUids,
            },
        };

        if (newCount <= 0) {
            delete newReactions[emoji];
        }

        await updateDoc(messageRef, { reactions: newReactions });

    } catch (error) {
        console.error(`Error toggling reaction for message ${messageId}:`, error);
        throw error;
    }
};

// =================================================================
// VIP & PROMO CODE FUNCTIONS
// =================================================================
export interface VipPromoCode {
    code: string;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    claimedBy: { [uid: string]: number };
    createdAt: number;
}
export interface BadgeGiftCode {
    type: 'badge_gift';
    code: string;
    badgeType: BadgeType;
    durationDays: number;
    totalUses: number;
    usesPerUser: number;
    claimedBy: { [uid: string]: number };
    createdAt: number;
}
export interface PointsPromoCode {
    code: string;
    amount: number;
    totalUses: number;
    claimedBy: { [uid: string]: number };
    createdAt: number;
}

let mockVipPromoCodes: VipPromoCode[] = [{ code: 'REDEEMBASIC7', durationDays: 7, totalUses: 100, usesPerUser: 1, claimedBy: {}, createdAt: Date.now() }];
let mockBadgeGiftCodes: BadgeGiftCode[] = [];
let mockPointsPromoCodes: PointsPromoCode[] = [{ code: 'GET100POINTS', amount: 100, totalUses: 100, claimedBy: {}, createdAt: Date.now() }];


export const updateVIPStatus = async (uid: string, isVIP: boolean, vipPack?: string, durationDays?: number) => {
    if (!isFirebaseEnabled()) {
        const userIndex = mockUserProfiles.findIndex(p => p.uid === uid);
        if (userIndex !== -1) {
            mockUserProfiles[userIndex].isVIP = isVIP;
            mockUserProfiles[userIndex].vipPack = vipPack;
            if (isVIP && durationDays) {
                mockUserProfiles[userIndex].vipExpiryTimestamp = Date.now() + durationDays * 24 * 60 * 60 * 1000;
            } else {
                 mockUserProfiles[userIndex].vipExpiryTimestamp = undefined;
            }
        }
        return;
    }
     try {
        const expiry = durationDays ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : undefined;
        await updateUserProfile(uid, { isVIP, vipPack, vipExpiryTimestamp: expiry });
    } catch (error) {
        console.error(`Error updating VIP status for ${uid}:`, error);
        throw error;
    }
};

export const redeemVipPromoCode = async (uid: string, code: string): Promise<{durationDays: number}> => {
    // This function will remain mock-only for security reasons in a client-side context.
    console.log(`[Mock] User ${uid} redeeming VIP promo code ${code}`);
    const promo = mockVipPromoCodes.find(p => p.code === code);
    if (!promo) throw new Error("Invalid or expired promo code.");

    await updateVIPStatus(uid, true, `Promo (${promo.durationDays} days)`, promo.durationDays);
    return { durationDays: promo.durationDays };
};

export const redeemPointsPromoCode = async (uid: string, code: string): Promise<{amount: number}> => {
    // Mock only
    console.log(`[Mock] User ${uid} redeeming Points promo code ${code}`);
    const promo = mockPointsPromoCodes.find(p => p.code === code);
    if (!promo) throw new Error("Invalid or expired points code.");
    
    const user = await getUserProfile(uid);
    if (!user) throw new Error("User not found");
    await updateUserProfile(uid, { points: (user.points || 0) + promo.amount });
    return { amount: promo.amount };
}

export const redeemBadgeGiftCode = async (uid: string, code: string): Promise<{badgeType: BadgeType, durationDays: number}> => {
     // Mock only
     console.log(`[Mock] User ${uid} redeeming Badge Gift code ${code}`);
     const promo = mockBadgeGiftCodes.find(p => p.code === code);
     if (!promo) throw new Error("Invalid or expired badge gift code.");

     const expiryTimestamp = Date.now() + promo.durationDays * 24 * 60 * 60 * 1000;
     const user = await getUserProfile(uid);
     if (!user) throw new Error("User not found");
     
     const badgeKey = `is${promo.badgeType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as keyof UserProfile;

     await updateUserProfile(uid, {
        [badgeKey]: true,
        badgeExpiry: {
            ...user.badgeExpiry,
            [promo.badgeType]: expiryTimestamp
        }
     });
     return { badgeType: promo.badgeType, durationDays: promo.durationDays };
}

export const getVipPromoCodes = async (): Promise<VipPromoCode[]> => {
    // Mock only
    return mockVipPromoCodes;
}
export const getBadgeGiftCodes = async (): Promise<BadgeGiftCode[]> => {
    // Mock only
    return mockBadgeGiftCodes;
}
export const getPointsPromoCodes = async (): Promise<PointsPromoCode[]> => {
    // Mock only
    return mockPointsPromoCodes;
}
export const createVipPromoCode = async (durationDays: number, totalUses: number, usesPerUser: number): Promise<string> => {
    const newCode: VipPromoCode = {
        code: `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        durationDays,
        totalUses,
        usesPerUser,
        claimedBy: {},
        createdAt: Date.now(),
    };
    mockVipPromoCodes.push(newCode);
    console.log(`[Mock] Created VIP promo code`, newCode);
    return newCode.code;
};
export const createBadgeGiftCode = async (badgeType: BadgeType, durationDays: number, totalUses: number, usesPerUser: number): Promise<BadgeGiftCode> => {
     const giftCode: BadgeGiftCode = {
        type: 'badge_gift',
        code: `BADGE-${badgeType.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        badgeType,
        durationDays,
        totalUses,
        usesPerUser,
        claimedBy: {},
        createdAt: Date.now(),
     };
    mockBadgeGiftCodes.push(giftCode);
    console.log(`[Mock] Created Badge gift code`, giftCode);
    return giftCode;
}
export const createPointsPromoCode = async (amount: number, totalUses: number): Promise<string> => {
    const newCode: PointsPromoCode = {
        code: `PTS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount,
        totalUses,
        claimedBy: {},
        createdAt: Date.now(),
    };
    mockPointsPromoCodes.push(newCode);
    console.log(`[Mock] Created Points promo code`, newCode);
    return newCode.code;
}
export const deleteVipPromoCode = async (code: string) => {
    mockVipPromoCodes = mockVipPromoCodes.filter(p => p.code !== code);
    console.log(`[Mock] Deleted VIP code ${code}`);
};
export const deleteBadgeGiftCode = async (code: string) => {
    mockBadgeGiftCodes = mockBadgeGiftCodes.filter(p => p.code !== code);
    console.log(`[Mock] Deleted Badge code ${code}`);
};
export const deletePointsPromoCode = async (code: string) => {
    mockPointsPromoCodes = mockPointsPromoCodes.filter(p => p.code !== code);
    console.log(`[Mock] Deleted Points code ${code}`);
};


export const getVerifiedContactLimit = (vipPack?: string): number => {
    if (!vipPack) return 3;
    const pack = vipPack.toLowerCase();
    if (pack.includes('gold') || pack.includes('platinum') || pack.includes('diamond') || pack.includes('elite')) return 10;
    if (pack.includes('starter') || pack.includes('bronze') || pack.includes('silver')) return 5;
    return 3;
}


// Gift Points
export const giftPoints = async (fromUid: string, toUid: string, amount: number) => {
    // Mock only
    const fromUser = await getUserProfile(fromUid);
    const toUser = await getUserProfile(toUid);

    if (!fromUser || !toUser) throw new Error("User not found.");
    if ((fromUser.points || 0) < amount) throw new Error("Insufficient points.");

    await updateUserProfile(fromUid, { points: (fromUser.points || 0) - amount });
    await updateUserProfile(toUid, { 
        points: (toUser.points || 0) + amount,
        hasNewPointsGift: true,
        pointsGifterUid: fromUid,
        lastGiftedPointsAmount: amount,
    });
    console.log(`[Mock] Gifted ${amount} points from ${fromUid} to ${toUid}`);
}
