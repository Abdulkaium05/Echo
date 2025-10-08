
// src/services/firestore.ts
import type { Timestamp } from 'firebase/firestore';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { ChatItemProps } from '@/components/chat/chat-item';
import { blueBirdAssistant, type BlueBirdAssistantInput, type BlueBirdAssistantOutput } from '@/ai/flows/blueBirdAiFlow';
import { addNotification } from './notificationService';
import type { UserProfile } from '@/types/user';
import type { SavedSong } from '@/context/music-player-context';

export const BOT_UID = 'blue-bird-bot';
export const DEV_UID = 'vip-dev';

export type { UserProfile };

let mockLocalUsers: UserProfile[] = [
  { uid: BOT_UID, displayUid: '00000001', name: 'Blue Bird (AI Assistant)', email: null, isBot: true, isVerified: true, isCreator: false, avatarUrl: 'outline-bird-avatar', lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as unknown as Timestamp},
  { uid: DEV_UID, displayUid: '00000002', name: 'Dev Team', email: 'devteam@example.com', isDevTeam: true, isVerified: true, isCreator: false, isVIP: true, vipPack: "Lifetime", avatarUrl: 'dev-team-svg-placeholder', createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'test-user', displayUid: '10000001', name: 'Test User', email: 'test@example.com', isVIP: false, isVerified: false, isCreator: false, avatarUrl: `https://picsum.photos/seed/test-user/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as unknown as Timestamp, selectedVerifiedContacts: [], hasMadeVipSelection: false, allowedNormalContacts: [] },
  { uid: 'verified-contact-1', displayUid: '20000001', name: 'Twaha mizan', email: 'twahamizan04@gmail.com', isVerified: true, isVIP: false, vipPack: undefined, isCreator: false, avatarUrl: `https://picsum.photos/seed/twaha-the-great/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 1 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: true, allowedNormalContacts: [] },
  { uid: 'verified-contact-2', displayUid: '20000002', name: 'Rakib', email: 'rakib@example.com', isVerified: true, isVIP: false, vipPack: undefined, isCreator: false, avatarUrl: `https://picsum.photos/seed/rakib-verified/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 10 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'regular-user-1', displayUid: '10000002', name: 'Ashadul', email: 'ashadul@example.com', isCreator: false, isVerified: true, avatarUrl: `https://picsum.photos/seed/ashadul-regular/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 30 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'monk-user-1', displayUid: '10000003', name: 'Karim Ahmed', email: 'monk1@example.com', isCreator: false, isVIP: true, vipPack: 'Gold VIP', avatarUrl: `https://picsum.photos/seed/monk-peaceful/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*2, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'monk-user-2', displayUid: '10000004', name: 'Sajid Islam', email: 'monk2@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/monk-zen/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*3, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'monk-user-3', displayUid: '10000005', name: 'Ayesha Siddika', email: 'monk3@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/monk-silent/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*4, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'monk-user-4', displayUid: '10000006', name: 'Fatima Akter', email: 'monk4@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/monk-meditative/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*5, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'monk-user-tanvir', displayUid: '20000003', name: 'Tanvir Ahhamed', email: 'tanvir@example.com', isVerified: true, isVIP: false, vipPack: undefined, isCreator: false, avatarUrl: `https://picsum.photos/seed/tanvir-the-great/200`, createdAt: { seconds: Date.now()/1000 - 500, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 5 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'verified-contact-3', displayUid: '20000004', name: 'Asad', email: 'asad@example.com', isVerified: true, isVIP: false, vipPack: undefined, isCreator: false, avatarUrl: `https://picsum.photos/seed/asad-verified/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 4 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'verified-contact-4', displayUid: '20000005', name: 'Saidul', email: 'saidul@example.com', isVerified: true, isVIP: false, vipPack: undefined, isCreator: false, avatarUrl: `https://picsum.photos/seed/saidul-verified/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 15 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'vip-user-2', displayUid: '20000006', name: 'Maria Oishee', email: 'maria@example.com', isVIP: false, vipPack: undefined, isCreator: false, isVerified: true, avatarUrl: `https://picsum.photos/seed/maria-oishee-new/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 1 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: true, allowedNormalContacts: [] },
  { uid: 'vip-user-3', displayUid: '20000007', name: 'Rafi', email: 'rafi@example.com', isVIP: false, vipPack: undefined, isCreator: false, isVerified: true, avatarUrl: `https://picsum.photos/seed/rafi-developer/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 25 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: true, allowedNormalContacts: [] },
  { uid: 'vip-only-user', displayUid: '10000007', name: 'Rahim Uddin', email: 'valerie@example.com', isVIP: true, vipPack: 'Bronze VIP', isCreator: false, isVerified: false, avatarUrl: `https://picsum.photos/seed/valerie-vip/200`, createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp, vipExpiryTimestamp: Date.now() + 5 * 24 * 60 * 60 * 1000, lastSeen: { seconds: Math.floor(Date.now()/1000) - 5 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: false },
  { uid: 'nayem-vip', displayUid: '20000008', name: 'Nayem', email: 'nayem@example.com', isVIP: false, vipPack: undefined, isCreator: false, isVerified: true, avatarUrl: `https://picsum.photos/seed/nayem-is-great/200`, createdAt: { seconds: Date.now()/1000 - 100, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 2 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: true, allowedNormalContacts: [] },
  { uid: 'abdul-kaium-verified', displayUid: '20000009', name: 'Abdul-Kaium', email: 'abdulkaiumiqbel2005@gmail.com', isVerified: true, isVIP: false, vipPack: undefined, isDevTeam: true, isCreator: false, avatarUrl: `https://picsum.photos/seed/kaium-verified/200`, createdAt: { seconds: Date.now()/1000 - 200, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 8 * 60, nanoseconds: 0} as unknown as Timestamp, allowedNormalContacts: [] },
  { uid: 'julker-nain-creator', displayUid: '30000001', name: 'Julker Nain', email: 'julker@example.com', isCreator: true, isVerified: true, isVIP: false, vipPack: undefined, avatarUrl: `https://picsum.photos/seed/julker-artist/200`, createdAt: { seconds: Date.now()/1000 - 250, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 3 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: false, allowedNormalContacts: [] },
  { uid: 'al-amin-creator', displayUid: '30000002', name: 'Al-Amin', email: 'alamin@example.com', isCreator: true, isVerified: true, isVIP: false, vipPack: undefined, avatarUrl: `https://picsum.photos/seed/al-amin-creator/200`, createdAt: { seconds: Date.now()/1000 - 300, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 6 * 60, nanoseconds: 0} as unknown as Timestamp, hasMadeVipSelection: false, allowedNormalContacts: [] },
  { uid: 'sakib-new-user', displayUid: '10000008', name: 'Sakib', email: 'sakib@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/sakib-user/200`, createdAt: { seconds: Date.now()/1000 - 400, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*6, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'walid-new-user', displayUid: '10000009', name: 'Walid', email: 'walid@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/walid-user/200`, createdAt: { seconds: Date.now()/1000 - 410, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*7, nanoseconds: 0} as unknown as Timestamp, isVIP: true, vipPack: "Starter VIP" },
  { uid: 'samia-new-user', displayUid: '10000010', name: 'Samia', email: 'samia@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/samia-user/200`, createdAt: { seconds: Date.now()/1000 - 420, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*8, nanoseconds: 0} as unknown as Timestamp },
  { uid: 'shamim-new-user', displayUid: '10000011', name: 'Shamim', email: 'shamim@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/shamim-user/200`, createdAt: { seconds: Date.now()/1000 - 430, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*9, nanoseconds: 0} as unknown as Timestamp, isVIP: true, vipPack: "Micro VIP" },
  { uid: 'jubayer-new-user', displayUid: '10000012', name: 'Jubayer', email: 'jubaye@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/jubaye-user/200`, createdAt: { seconds: Date.now()/1000 - 440, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*10, nanoseconds: 0} as unknown as Timestamp, isVIP: true, vipPack: "Silver VIP" },
  { uid: 'hadi-new-user', displayUid: '10000013', name: 'Hadi', email: 'hadi@example.com', isCreator: false, avatarUrl: `https://picsum.photos/seed/hadi-user/200`, createdAt: { seconds: Date.now()/1000 - 450, nanoseconds: 0} as unknown as Timestamp, lastSeen: { seconds: Math.floor(Date.now()/1000) - 60*60*11, nanoseconds: 0} as unknown as Timestamp },
];

export const updateUserProfile = async (user: FirebaseAuthUser, additionalData?: Partial<UserProfile>): Promise<void> => {
  console.log(`[updateUserProfile] Updating profile for UID: ${user.uid}`, additionalData);
  const userIndex = mockLocalUsers.findIndex(u => u.uid === user.uid);
  if (userIndex !== -1) {
    mockLocalUsers[userIndex] = { ...mockLocalUsers[userIndex], ...additionalData, name: additionalData?.name || mockLocalUsers[userIndex].name, email: additionalData?.email || mockLocalUsers[userIndex].email };
    // If the currently logged-in user is the one being updated, refresh their profile
    if (user.uid === CURRENT_DEMO_USER_ID) {
      CURRENT_USER_PROFILE = mockLocalUsers[userIndex];
      // This is a critical step to ensure other parts of the app that rely on this see the update.
      notifyChatListListeners(CURRENT_DEMO_USER_ID);
    }
  } else {
    const newUserProfile: UserProfile = {
        uid: user.uid,
        displayUid: additionalData?.displayUid || Math.floor(10000000 + Math.random() * 90000000).toString(),
        name: additionalData?.name || user.displayName || 'User',
        email: additionalData?.email || user.email,
        avatarUrl: additionalData?.avatarUrl || `https://picsum.photos/seed/${user.uid}/200`,
        isVIP: additionalData?.isVIP || false,
        vipPack: additionalData?.vipPack,
        vipExpiryTimestamp: additionalData?.vipExpiryTimestamp,
        isBot: user.uid === BOT_UID,
        isDevTeam: user.uid === DEV_UID || additionalData?.isDevTeam || false,
        isVerified: additionalData?.isVerified || user.uid === BOT_UID || user.uid === DEV_UID || (additionalData?.isDevTeam || false),
        isCreator: additionalData?.isCreator || false, // Default to false
        createdAt: (additionalData?.createdAt || { seconds: Date.now()/1000, nanoseconds: 0}) as unknown as Timestamp,
        lastSeen: (additionalData?.lastSeen || { seconds: Date.now()/1000, nanoseconds: 0}) as unknown as Timestamp,
        selectedVerifiedContacts: additionalData?.selectedVerifiedContacts || [],
        allowedNormalContacts: additionalData?.allowedNormalContacts || [],
        hasMadeVipSelection: additionalData?.hasMadeVipSelection || false,
        ...additionalData,
    };
    mockLocalUsers.push(newUserProfile);
    console.log(`[updateUserProfile] Added new user profile to local store:`, newUserProfile);
  }
  return Promise.resolve();
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  console.log(`[getUserProfile] Fetching profile for UID: ${userId}`);
  const profile = mockLocalUsers.find(u => u.uid === userId);
  if (profile) return Promise.resolve(profile);

  console.warn(`[getUserProfile] User ${userId} not found in local user store.`);
  return Promise.resolve(null);
};

export const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
  console.log(`[findUserByEmail] Searching for user with email: ${email}`);
  const normalizedEmail = email.trim().toLowerCase();
  const profile = mockLocalUsers.find(u => u.email?.toLowerCase() === normalizedEmail);
  return Promise.resolve(profile || null);
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

let CURRENT_DEMO_USER_ID = 'test-user';
let CURRENT_USER_PROFILE: UserProfile | null = mockLocalUsers.find(u => u.uid === CURRENT_DEMO_USER_ID) || null;

export const setDemoUserId = (userId: string) => {
    CURRENT_DEMO_USER_ID = userId;
    CURRENT_USER_PROFILE = mockLocalUsers.find(u => u.uid === userId) || null;

    // Update lastSeen for the logged-in user to 'now'
    const userIndex = mockLocalUsers.findIndex(u => u.uid === userId);
    if(userIndex !== -1) {
        mockLocalUsers[userIndex].lastSeen = { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as unknown as Timestamp;
    }

    mockChats = mockChats.map(chat => {
        const newParticipants = chat.participants.map(p => p === 'test-user-placeholder' ? userId : p).sort();
        if (chat.participants.includes(BOT_UID) && !newParticipants.includes(BOT_UID)) newParticipants.push(BOT_UID);
        if (chat.participants.includes(DEV_UID) && !newParticipants.includes(DEV_UID)) newParticipants.push(DEV_UID);

        return {
            ...chat,
            participants: [...new Set(newParticipants)].sort(),
            lastMessageSenderId: chat.lastMessageSenderId === 'test-user-placeholder' ? userId : chat.lastMessageSenderId,
        };
    });

    for (const chatId in mockMessages) {
        mockMessages[chatId] = mockMessages[chatId].map(msg => ({
            ...msg,
            senderId: msg.senderId === 'test-user-placeholder' ? userId : msg.senderId
        }));
    }
    console.log(`[firestore] Demo User ID set to: ${userId}. Mock data participants and sender IDs updated.`);
    notifyChatListListeners(userId);
};


let mockChats: Chat[] = [
    { id: 'chat-dev-team', participants: ['test-user-placeholder', DEV_UID].sort(), lastMessage: 'Hello Dev Team!', lastMessageSenderId: 'test-user-placeholder', lastMessageTimestamp: { seconds: Date.now()/1000 - 3600, nanoseconds: 0} as unknown as Timestamp, createdAt: { seconds: Date.now()/1000 - 7200, nanoseconds: 0} as unknown as Timestamp },
    { id: 'chat-blue-bird', participants: ['test-user-placeholder', BOT_UID].sort(), lastMessage: 'Hi, how can I help?', lastMessageSenderId: BOT_UID, lastMessageTimestamp: { seconds: Date.now()/1000 - 1800, nanoseconds: 0} as unknown as Timestamp, createdAt: { seconds: Date.now()/1000 - 3600, nanoseconds: 0} as unknown as Timestamp },
];

let mockMessages: { [chatId: string]: Message[] } = {
    'chat-dev-team': [
        { id: 'm1', chatId: 'chat-dev-team', senderId: 'test-user-placeholder', senderName: 'Test User', text: 'Hello Dev Team!', timestamp: { seconds: Date.now()/1000 - 3600, nanoseconds: 0} as unknown as Timestamp, seenBy: [DEV_UID] },
        { id: 'm2', chatId: 'chat-dev-team', senderId: DEV_UID, senderName: 'Dev Team', text: 'Hi Test User, how can we help?', timestamp: { seconds: Date.now()/1000 - 3500, nanoseconds: 0} as unknown as Timestamp },
    ],
    'chat-blue-bird': [
        { id: 'm3', chatId: 'chat-blue-bird', senderId: 'test-user-placeholder', senderName: 'Test User', text: 'Hi Blue Bird!', timestamp: { seconds: Date.now()/1000 - 1800, nanoseconds: 0} as unknown as Timestamp, seenBy: [BOT_UID] },
        { id: 'm4', chatId: 'chat-blue-bird', senderId: BOT_UID, senderName: 'Blue Bird (AI Assistant)', text: 'Hi, how can I help?', timestamp: { seconds: Date.now()/1000 - 1700, nanoseconds: 0} as unknown as Timestamp },
    ],
};

const ensureAllUserChatsExist = (activeUserId: string) => {
    mockLocalUsers.forEach(user => {
        // Skip creating a chat with self
        if (user.uid === activeUserId) return;

        const chatExists = mockChats.some(c => 
            c.participants.includes(activeUserId) && c.participants.includes(user.uid)
        );

        if (!chatExists) {
            const newChatId = `chat-${activeUserId}-${user.uid}`;
            const isBotOrDev = user.isBot || user.isDevTeam;
            const newChat: Chat = {
                id: newChatId,
                participants: [activeUserId, user.uid].sort(),
                lastMessage: isBotOrDev ? `Welcome! Chat with ${user.name} now.` : `Say hi to ${user.name}!`,
                lastMessageSenderId: isBotOrDev ? user.uid : 'system',
                lastMessageTimestamp: { seconds: (Date.now()/1000) - (Math.random() * 10000 + 1500), nanoseconds: 0} as unknown as Timestamp,
            };
            mockChats.push(newChat);
            
            // Ensure message list exists for new chat
            if (!mockMessages[newChatId]) {
                mockMessages[newChatId] = [];
            }

            // Pre-populate with welcome message for bot/dev chats
             if (isBotOrDev && mockMessages[newChatId].length === 0) {
                mockMessages[newChatId].push({
                    id: `msg-welcome-${user.uid}`,
                    chatId: newChatId,
                    senderId: user.uid,
                    text: newChat.lastMessage,
                    timestamp: newChat.lastMessageTimestamp,
                });
            }
        }
    });
}


let chatListListeners: Array<{ userId: string, callback: (chats: Chat[]) => void }> = [];

const notifyChatListListeners = (userId: string) => {
    const userProfile = mockLocalUsers.find(p => p.uid === userId);

    if (!userProfile) {
        console.warn(`notifyChatListListeners: No user profile found for UID ${userId}. Notifying with empty list.`);
        const relevantListeners = chatListListeners.filter(l => l.userId === userId);
        relevantListeners.forEach(l => l.callback([]));
        return;
    }
    
    // This function is now just for a single user, so it's more efficient.
    ensureAllUserChatsExist(userProfile.uid);

    const userChats = mockChats.filter(chat => {
        if (!chat.participants.includes(userProfile.uid)) {
            return false;
        }
        
        const otherParticipantId = chat.participants.find(p => p !== userProfile.uid);
        if (!otherParticipantId) return false;

        const otherParticipantProfile = mockLocalUsers.find(u => u.uid === otherParticipantId);
        if (!otherParticipantProfile) return false;
        
        // Always show Bot and Dev Team
        if (otherParticipantProfile.isDevTeam || otherParticipantProfile.isBot) {
            return true;
        }

        // Show users who are ONLY VIP (not also verified or creator)
        if (otherParticipantProfile.isVIP && !otherParticipantProfile.isVerified && !otherParticipantProfile.isCreator) {
            return true;
        }
        
        const isOtherUserExclusive = otherParticipantProfile.isVerified || otherParticipantProfile.isCreator;
        
        // If the other user is a verified/creator type
        if (isOtherUserExclusive) {
            // Check if current user has selected them
            const isSelected = userProfile.selectedVerifiedContacts?.includes(otherParticipantId);
            // Check if a chat history already exists
            const hasMessages = mockMessages[chat.id!]?.length > 0;
            return isSelected || hasMessages;
        }
        
        // For all other cases (normal user to normal user, etc.), show the chat.
        return true;
    });

    const enrichedChats = userChats.map(chat => {
        const participantDetails: Chat['participantDetails'] = {};
        chat.participants.forEach(pId => {
            const profile = mockLocalUsers.find(u => u.uid === pId);
            if (profile) {
                participantDetails[pId] = {
                    uid: pId, name: profile.name, avatarUrl: profile.avatarUrl,
                    isVIP: profile.isVIP, isVerified: profile.isVerified, isDevTeam: profile.isDevTeam, isBot: profile.isBot, isCreator: profile.isCreator,
                    lastSeen: profile.lastSeen
                };
            } else {
                 participantDetails[pId] = { uid: pId, name: "Unknown User"};
            }
        });
        const updatedParticipants = chat.participants.map(p => p === 'test-user-placeholder' ? userProfile.uid : p).sort();
        return { ...chat, participants: updatedParticipants, participantDetails };
    });
    
    const relevantListeners = chatListListeners.filter(l => l.userId === userId);
    relevantListeners.forEach(listener => {
        try {
            listener.callback([...enrichedChats]);
        } catch (e) {
            console.error("[notifyChatListListeners] Error in listener callback:", e);
        }
    });
};


export const getUserChats = (
    userId: string,
    userProfile: UserProfile, // The current user's profile
    callback: (chats: Chat[]) => void,
    onError: (error: Error) => void
): (() => void) => {
  console.log(`[getUserChats] Registering listener for user: ${userId}`);
  
  if (userId !== CURRENT_DEMO_USER_ID) {
      console.warn(`[getUserChats] Subscribing user (${userId}) does not match current demo user (${CURRENT_DEMO_USER_ID}). This might cause issues.`);
  }

  const listener = { userId, callback };
  chatListListeners.push(listener);

  try {
    // Initial fetch for the subscriber
    notifyChatListListeners(userId);
  } catch (e: any) {
    onError(e);
  }

  return () => {
    console.log(`[getUserChats] Unregistering listener for user ${userId}.`);
    chatListListeners = chatListListeners.filter(l => l !== listener);
  };
};

export const findChatBetweenUsers = async (userId1: string, userId2: string): Promise<string | null> => {
  console.log(`[findChatBetweenUsers] Searching for chat between ${userId1} and ${userId2}`);
  if (userId1 === userId2) return null;
  const sortedParticipants = [userId1, userId2].sort();
  const chat = mockChats.find(c => {
      const currentSorted = [...c.participants].sort();
      return currentSorted.join(',') === sortedParticipants.join(',');
  });
  return Promise.resolve(chat?.id || null);
};

export const createChat = async (userId1: string, userId2: string): Promise<string> => {
  console.log(`[createChat] Creating chat between ${userId1} and ${userId2}`);
  if (userId1 === userId2) throw new Error("Cannot create chat with self.");

  const existingChatId = await findChatBetweenUsers(userId1, userId2);
  if (existingChatId) {
      // Chat already exists, ensure both users are notified of any potential updates.
      notifyChatListListeners(userId1);
      notifyChatListListeners(userId2);
      return existingChatId;
  }

  const newChatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sortedParticipants = [userId1, userId2].sort();
  const newChat: Chat = {
    id: newChatId,
    participants: sortedParticipants,
    lastMessage: 'Chat created.',
    lastMessageSenderId: userId1,
    lastMessageTimestamp: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp,
    createdAt: { seconds: Date.now()/1000, nanoseconds: 0} as unknown as Timestamp,
  };
  mockChats.push(newChat);
  if (!mockMessages[newChatId]) {
    mockMessages[newChatId] = [];
  }
  console.log(`[createChat] New chat created with ID: ${newChatId}`);
  
  // Notify both participants that their chat lists need updating
  notifyChatListListeners(userId1);
  notifyChatListListeners(userId2);

  return Promise.resolve(newChatId);
};

export const sendWelcomeMessage = async (newUserId: string): Promise<void> => {
  console.log(`[sendWelcomeMessage] Sending welcome to ${newUserId}`);
  if (newUserId === BOT_UID) {
      console.log("[sendWelcomeMessage] Target user is the bot itself. Skipping welcome message.");
      return Promise.resolve();
  }
  try {
    const chatId = await createChat(newUserId, BOT_UID);
    const welcomeText = "Welcome to Echo Message! 🎉 I'm Blue Bird, your AI Assistant. How can I assist you today?";
    await sendMessage(chatId, BOT_UID, welcomeText, undefined, undefined, true);
    console.log(`[sendWelcomeMessage] Welcome message sent to ${newUserId} in chat ${chatId}`);
  } catch (error) {
    console.error(`[sendWelcomeMessage] Error:`, error);
  }
};

let chatMessageListeners: { [chatId: string]: Array<(messages: Message[]) => void> } = {};

const notifyMessageListeners = (chatId: string) => {
  if (chatMessageListeners[chatId]) {
    const updatedMessagesForChat = [...(mockMessages[chatId] || [])].map(msg => {
        const senderProfile = mockLocalUsers.find(u => u.uid === msg.senderId);
        return {
            ...msg,
            senderName: senderProfile?.name || 'User',
        };
    });

    chatMessageListeners[chatId].forEach(listener => {
        try {
            listener(updatedMessagesForChat);
        } catch (e) {
            console.error("[notifyMessageListeners] Error in listener callback:", e);
        }
    });
  }
};


export const getChatMessages = (
    chatId: string,
    callback: (messages: Message[]) => void,
    onError: (error: Error) => void
): (() => void) => {
  console.log(`[getChatMessages] Registering listener for chat ID: ${chatId}`);

  if (!chatMessageListeners[chatId]) {
    chatMessageListeners[chatId] = [];
  }
  if (!chatMessageListeners[chatId].includes(callback)) {
    chatMessageListeners[chatId].push(callback);
  }

  try {
    const messagesForChat = (mockMessages[chatId] || []).map(msg => {
        const senderProfile = mockLocalUsers.find(u => u.uid === msg.senderId);
        return {
            ...msg,
            senderName: senderProfile?.name || 'User',
        };
    });
    
    Promise.resolve().then(() => callback(messagesForChat));
  } catch (e: any) {
    onError(e);
  }

  return () => {
    console.log(`[getChatMessages] Unregistering listener for chat ${chatId}.`);
    if (chatMessageListeners[chatId]) {
      chatMessageListeners[chatId] = chatMessageListeners[chatId].filter(cb => cb !== callback);
      if (chatMessageListeners[chatId].length === 0) {
        delete chatMessageListeners[chatId];
      }
    }
  };
};


export const sendMessage = async (
    chatId: string,
    senderId: string,
    text: string,
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number },
    replyingTo?: Message['replyingTo'],
    isBotMessage: boolean = false,
    isWittyReactionResponse?: boolean,
    repliedToReactionOnMessageId?: string,
    repliedToReactionEmoji?: string,
): Promise<void> => {
  const attachmentUrl = attachmentData?.dataUri;
  const attachmentName = attachmentData?.name;
  const attachmentType = attachmentData?.type;
  const audioDuration = attachmentData?.duration;

  console.log(`[sendMessage] Sending message from ${senderId} to chat ${chatId}. Attachment: ${attachmentName} (${attachmentType}). Reply: ${!!replyingTo}. IsBot: ${isBotMessage}`);
  const trimmedText = text.trim();
  if (!chatId || !senderId || (!trimmedText && !attachmentUrl)) {
    console.warn("[sendMessage] Invalid input.", { chatId, senderId, text: trimmedText, attachmentUrl });
    throw new Error("Invalid input for sending message.");
  }

  const senderProfile = mockLocalUsers.find(u => u.uid === senderId);

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    chatId,
    senderId,
    senderName: senderProfile?.name || 'User',
    text: trimmedText,
    attachmentUrl: attachmentUrl,
    attachmentName: attachmentName,
    attachmentType: attachmentType,
    audioDuration: audioDuration,
    timestamp: { seconds: Math.floor(Date.now()/1000), nanoseconds: 0} as unknown as Timestamp,
    replyingTo: replyingTo || null,
    reactions: {},
    isWittyReactionResponse: isWittyReactionResponse,
    repliedToReactionOnMessageId: repliedToReactionOnMessageId,
    repliedToReactionEmoji: repliedToReactionEmoji,
  };

  if (!mockMessages[chatId]) {
    mockMessages[chatId] = [];
  }
  mockMessages[chatId].push(newMessage);

  const chatIndex = mockChats.findIndex(c => c.id === chatId);
  if (chatIndex !== -1) {
    const chat = mockChats[chatIndex];
    let lastMsgText = trimmedText;
    if (attachmentType === 'image') lastMsgText = trimmedText ? `${trimmedText} [Photo]` : "[Photo]";
    else if (attachmentType === 'video') lastMsgText = trimmedText ? `${trimmedText} [Video]` : "[Video]";
    else if (attachmentType === 'audio') lastMsgText = "[Audio Message]";
    else if (attachmentType === 'document') lastMsgText = trimmedText ? `${trimmedText} [${attachmentName || 'Document'}]` : `[${attachmentName || 'Document'}]`;
    
    chat.lastMessage = lastMsgText;
    chat.lastMessageTimestamp = newMessage.timestamp;
    chat.lastMessageSenderId = senderId;
    
    // Notify both participants that their chat lists need updating
    notifyChatListListeners(chat.participants[0]);
    notifyChatListListeners(chat.participants[1]);
  } else {
      console.warn(`[sendMessage] Chat with ID ${chatId} not found in mockChats to update last message.`);
  }
  console.log(`[sendMessage] Message added to chat ${chatId}:`, newMessage);

  notifyMessageListeners(chatId);

  return Promise.resolve();
};


export const deleteMessage = async (chatId: string, messageId: string): Promise<void> => {
  console.log(`[deleteMessage] Deleting message ${messageId} from chat ${chatId}`);
  if (!mockMessages[chatId]) {
    console.warn(`[deleteMessage] Chat ${chatId} not found in mockMessages.`);
    return Promise.resolve();
  }
  const messageIndex = mockMessages[chatId].findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    const deletedMessage = mockMessages[chatId][messageIndex];
    
    mockMessages[chatId][messageIndex].text = "This message was deleted.";
    mockMessages[chatId][messageIndex].attachmentUrl = undefined;
    mockMessages[chatId][messageIndex].attachmentName = undefined;
    mockMessages[chatId][messageIndex].attachmentType = undefined;
    mockMessages[chatId][messageIndex].isDeleted = true;
    mockMessages[chatId][messageIndex].replyingTo = null;
    mockMessages[chatId][messageIndex].reactions = {}; 

    console.log(`[deleteMessage] Message ${messageId} marked as deleted.`);
    notifyMessageListeners(chatId);

    const chat = mockChats.find(c => c.id === chatId);
    if (chat) {
        if (chat.lastMessageTimestamp.seconds === deletedMessage.timestamp.seconds && chat.lastMessageSenderId === deletedMessage.senderId) {
            if (mockMessages[chatId].length === 0 || mockMessages[chatId].every(m => m.isDeleted) || mockMessages[chatId][mockMessages[chatId].length -1].id === messageId) {
                chat.lastMessage = "This message was deleted.";
            } else {
                let newLastMessage: Message | undefined;
                for (let i = mockMessages[chatId].length - 1; i >= 0; i--) {
                    if (!mockMessages[chatId][i].isDeleted) {
                        newLastMessage = mockMessages[chatId][i];
                        break;
                    }
                }
                if (newLastMessage) {
                    let lastMsgText = newLastMessage.text || "";
                    if (newLastMessage.attachmentType === 'image') lastMsgText = newLastMessage.text ? `${newLastMessage.text} [Photo]` : "[Photo]";
                    else if (newLastMessage.attachmentType === 'video') lastMsgText = newLastMessage.text ? `${newLastMessage.text} [Video]` : "[Video]";
                    else if (newLastMessage.attachmentType === 'audio') lastMsgText = "[Audio Message]";
                    else if (newLastMessage.attachmentType === 'document') lastMsgText = newLastMessage.text ? `${newLastMessage.text} [${newLastMessage.attachmentName || 'Document'}]` : `[${newLastMessage.attachmentName || 'Document'}]`;
                    
                    chat.lastMessage = lastMsgText;
                    chat.lastMessageTimestamp = newLastMessage.timestamp;
                    chat.lastMessageSenderId = newLastMessage.senderId;
                } else {
                     chat.lastMessage = "Chat cleared.";
                }
            }
            notifyChatListListeners(chat.participants[0]);
            notifyChatListListeners(chat.participants[1]);
        }
    }

  } else {
    console.warn(`[deleteMessage] Message ${messageId} not found in chat ${chatId}.`);
  }
  return Promise.resolve();
};

export const removeChat = (chatId: string): void => {
    const chatIndex = mockChats.findIndex(c => c.id === chatId);
    if (chatIndex > -1) {
        const chat = mockChats[chatIndex];
        mockChats.splice(chatIndex, 1);
        delete mockMessages[chatId];
        notifyChatListListeners(chat.participants[0]);
        notifyChatListListeners(chat.participants[1]);
    }
}


export const updateVIPStatus = async (userId: string, isVIP: boolean, vipPack?: string, durationDays?: number): Promise<void> => {
  console.log(`[updateVIPStatus] Updating VIP for ${userId} to ${isVIP}`);
  const userIndex = mockLocalUsers.findIndex(u => u.uid === userId);
  if (userIndex !== -1) {
    mockLocalUsers[userIndex].isVIP = isVIP;
    mockLocalUsers[userIndex].vipPack = isVIP ? vipPack : undefined;
    mockLocalUsers[userIndex].vipExpiryTimestamp = isVIP && durationDays && durationDays !== Infinity ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : undefined;
    if (!isVIP) {
        mockLocalUsers[userIndex].selectedVerifiedContacts = [];
        mockLocalUsers[userIndex].hasMadeVipSelection = false;
    }
    if (userId === CURRENT_DEMO_USER_ID) {
      CURRENT_USER_PROFILE = mockLocalUsers[userIndex];
    }
    notifyChatListListeners(userId);
  } else {
      console.warn(`[updateVIPStatus] User ${userId} not found to update VIP status.`);
  }
  return Promise.resolve();
};

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
      console.warn(`Could not find other participant for chat ${chat.id} and user ${currentUserId}`);
      return { // Return a fallback object
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

  let name = otherDetails?.name || 'Chat User';
  const avatarUrl = otherDetails?.avatarUrl;

  const isContactDevTeam = otherParticipantId === DEV_UID;
  const isContactBot = otherParticipantId === BOT_UID;
  const isContactGenerallyVerified = !!otherDetails?.isVerified;
  const isContactCreator = !!otherDetails?.isCreator;
  const isContactActuallyVIP = !!otherDetails?.isVIP;
  
  if (isContactBot) name = 'Blue Bird (AI Assistant)';
  if (isContactDevTeam) name = 'Dev Team';

  let iconIdentifier: string | undefined = undefined;
  if (isContactBot && avatarUrl === 'outline-bird-avatar') { 
      iconIdentifier = 'outline-bird-avatar';
  } else if (isContactDevTeam) {
      iconIdentifier = 'dev-team-svg';
  }

  const isLastMessageSentByCurrentUser = chat.lastMessageSenderId === currentUserId;

  const onlineStatus = formatLastSeen(otherDetails?.lastSeen);
  const isOnline = onlineStatus === 'Online';

  return {
    id: chat.id!,
    name: name,
    contactUserId: otherParticipantId || '',
    avatarUrl: avatarUrl, 
    lastMessage: chat.lastMessage,
    timestamp: formatTimestamp(chat.lastMessageTimestamp),
    lastMessageTimestampValue: chat.lastMessageTimestamp.seconds,
    isVerified: isContactGenerallyVerified,
    isContactVIP: isContactActuallyVIP,
    isDevTeam: isContactDevTeam,
    isBot: isContactBot,
    isCreator: isContactCreator,
    href: `/chat/${chat.id}`,
    iconIdentifier: iconIdentifier, 
    isLastMessageSentByCurrentUser: isLastMessageSentByCurrentUser,
    isOnline: isOnline,
    onlineStatus: onlineStatus,
    onBlockUser: () => {}, // Placeholder, will be overridden in ChatList
    onUnblockUser: () => {}, // Placeholder
    onDeleteChat: () => {}, // Placeholder
    onViewProfile: () => {},
  };
};


export const toggleReaction = async (chatId: string, messageId: string, emoji: string, userId: string): Promise<void> => {
  console.log(`[toggleReaction] User ${userId} toggled reaction ${emoji} for message ${messageId} in chat ${chatId}`);
  if (!mockMessages[chatId]) {
    console.warn(`[toggleReaction] Chat ${chatId} not found.`);
    return;
  }
  const messageIndex = mockMessages[chatId].findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) {
    console.warn(`[toggleReaction] Message ${messageId} not found in chat ${chatId}.`);
    return;
  }

  const message = mockMessages[chatId][messageIndex];
  if (!message.reactions) {
    message.reactions = {};
  }

  const previousReactionsOfUser: string[] = [];

  for (const existingEmoji in message.reactions) {
    if (message.reactions[existingEmoji].users.includes(userId)) {
      previousReactionsOfUser.push(existingEmoji);
    }
  }

  if (previousReactionsOfUser.includes(emoji)) {
    message.reactions[emoji].count--;
    message.reactions[emoji].users = message.reactions[emoji].users.filter(u => u !== userId);
    if (message.reactions[emoji].count === 0) {
      delete message.reactions[emoji];
    }
  } else {
    for (const prevEmoji of previousReactionsOfUser) {
      if (message.reactions[prevEmoji]) {
        message.reactions[prevEmoji].count--;
        message.reactions[prevEmoji].users = message.reactions[prevEmoji].users.filter(u => u !== userId);
        if (message.reactions[prevEmoji].count === 0) {
          delete message.reactions[prevEmoji];
        }
      }
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = { count: 0, users: [] };
    }
    message.reactions[emoji].count++;
    message.reactions[emoji].users.push(userId);
  }

  mockMessages[chatId][messageIndex] = { ...message };
  notifyMessageListeners(chatId);

  return Promise.resolve();
};

export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
  if (!mockMessages[chatId]) {
    return;
  }
  let changed = false;
  mockMessages[chatId].forEach(msg => {
    // Mark messages sent by OTHERS that the current user hasn't seen yet
    if (msg.senderId !== userId && (!msg.seenBy || !msg.seenBy.includes(userId))) {
      if (!msg.seenBy) {
        msg.seenBy = [];
      }
      msg.seenBy.push(userId);
      changed = true;
    }
  });

  if (changed) {
    console.log(`[markMessagesAsSeen] Marked messages as seen by ${userId} in chat ${chatId}`);
    notifyMessageListeners(chatId);
  }
};


export const getVerifiedUsers = async (): Promise<UserProfile[]> => {
    return Promise.resolve(mockLocalUsers.filter(u => u.isVerified && !u.isBot && !u.isDevTeam));
};

export const getNormalUsers = async (): Promise<UserProfile[]> => {
    return Promise.resolve(mockLocalUsers.filter(u => !u.isVerified && !u.isBot && !u.isDevTeam));
};

export const getVerifiedContactLimit = (vipPack?: string): number => {
    if (!vipPack) return 0;
    const pack = vipPack.toLowerCase();
    if (pack.includes('gold') || pack.includes('platinum') || pack.includes('diamond') || pack.includes('elite')) return 10;
    if (pack.includes('starter') || pack.includes('bronze') || pack.includes('silver')) return 5;
    if (pack.includes('micro') || pack.includes('mini') || pack.includes('basic')) return 3;
    return 0;
};

// New Types and Mock Data for Ratings
export interface AppRating {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  review: string;
  timestamp: Timestamp;
  devReply?: string;
}

let mockRatings: AppRating[] = [
    {
        id: 'rating-1',
        userId: 'julker-nain-creator',
        userName: 'Julker Nain',
        userAvatar: mockLocalUsers.find(u => u.uid === 'julker-nain-creator')?.avatarUrl,
        rating: 5,
        review: 'This app is amazing! So smooth and the features are fantastic. The AI assistant is surprisingly helpful. Highly recommended!',
        timestamp: { seconds: Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60), nanoseconds: 0 } as Timestamp,
        devReply: 'Thank you so much for the kind words, Julker! We\'re thrilled you\'re enjoying the experience. More great features are on the way!'
    },
    {
        id: 'rating-2',
        userId: 'vip-only-user',
        userName: 'Rahim Uddin',
        userAvatar: mockLocalUsers.find(u => u.uid === 'vip-only-user')?.avatarUrl,
        rating: 4,
        review: 'Pretty good app. The VIP features are nice and I like the clean design. Sometimes it feels a bit slow when sending images.',
        timestamp: { seconds: Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60), nanoseconds: 0 } as Timestamp,
    }
];

export const getRatings = async (): Promise<AppRating[]> => {
  console.log('[getRatings] Fetching all app ratings.');
  // sort by newest first
  return Promise.resolve([...mockRatings].sort((a, b) => b.timestamp.seconds - a.timestamp.seconds));
};

export const addRating = async (ratingData: Omit<AppRating, 'id' | 'timestamp'>): Promise<void> => {
    console.log(`[addRating] User ${ratingData.userId} is adding/updating a rating.`);
    const existingRatingIndex = mockRatings.findIndex(r => r.userId === ratingData.userId);

    const newRating: AppRating = {
        ...ratingData,
        id: `rating-${Date.now()}`,
        timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as Timestamp
    };

    if (existingRatingIndex !== -1) {
        mockRatings[existingRatingIndex] = { ...mockRatings[existingRatingIndex], ...ratingData, timestamp: newRating.timestamp };
    } else {
        mockRatings.push(newRating);
    }
    return Promise.resolve();
};

export const addDevReply = async (ratingId: string, replyText: string): Promise<void> => {
    console.log(`[addDevReply] Adding reply to rating ${ratingId}.`);
    const ratingIndex = mockRatings.findIndex(r => r.id === ratingId);
    if (ratingIndex !== -1) {
        mockRatings[ratingIndex].devReply = replyText;
    } else {
        throw new Error('Rating not found.');
    }
    return Promise.resolve();
};


export { mockLocalUsers, mockChats };
