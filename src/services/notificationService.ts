
'use client';
import { produce } from 'immer';

export interface Notification {
  id: string;
  type: 'welcome' | 'new_message' | 'system' | 'announcement';
  title: string;
  message: string; // A short summary for the popover list
  personaMessages?: {
    'blue-bird': string;
    'green-leaf': string;
    'echo-bot': string;
  };
  timestamp: number;
  isRead: boolean;
  relatedData?: {
    chatId?: string;
    senderId?: string;
  };
}

const defaultAnnouncements: Notification[] = [
    {
        id: 'announcement-suggest-feature-1',
        type: 'announcement',
        title: "Your Idea, Your Impact!",
        message: "Suggest a feature and earn the exclusive Creator badge if we build it!",
        timestamp: new Date('2025-10-16T09:00:00Z').getTime(),
        isRead: false,
        personaMessages: {
            'blue-bird': "Got a brilliant idea for Echo Message? Now's your chance to share it! We've just launched a 'Suggest a Feature' page, accessible from your user menu. Submit your concept, and if developer Abdul-Kaium builds it, you'll be awarded the exclusive Creator badge and 10,000 points as a thank you!",
            'green-leaf': "The forest of ideas is now open. A new path, 'Suggest a Feature,' has appeared in your menu. Share a seed of inspiration for how this space might grow. If your idea is chosen to take root and blossom, our creator, Abdul-Kaium, will honor you with the Creator's emblem and a gift of 10,000 points.",
            'echo-bot': "[System Update: Feature Suggestion Protocol Activated] A new input channel is available in the user menu. Submit proposals for new application functionalities. If a proposal is implemented by developer Abdul-Kaium, the originating user unit will be designated with 'Creator' status and awarded 10,000 points. Submit your data for a chance to influence future operational parameters."
        }
    },
    {
        id: 'announcement-pioneer-gift-1',
        type: 'announcement',
        title: "A Gift for Our First Pioneers!",
        message: "The first 10 users will receive a Beta badge, 10,000 points, and a 30-day Verified badge!",
        timestamp: new Date('2025-10-14T09:00:00Z').getTime(),
        isRead: false,
        personaMessages: {
            'blue-bird': "Huge news from the developer's nest! To celebrate our launch, Abdul-Kaium is giving an exclusive welcome package to our first 10 users. If you're one of them, you'll receive the rare Beta Tester badge—this is the only time it will ever be available! You'll also get a bonus of 10,000 points AND a Verified checkmark for 30 days. Welcome to the flock!",
            'green-leaf': "A message of gratitude blossoms from our creator, Abdul-Kaium. For the first 10 seeds of this new ecosystem, a special gift awaits. You will receive a Beta Tester badge to mark your early presence, a unique treasure that will not be offered again. You will also be gifted 10,000 points to help you flourish, and the mark of Verification for 30 suns. Thank you for being the first to grow with us.",
            'echo-bot': "[System Directive: Genesis User Reward Protocol] Initiated by developer Abdul-Kaium. Objective: Reward foundational user base. Target: First (10) registered accounts. Reward Package: [1x] 'Beta Tester' status badge (Terminal Distribution), [1x] 'Verified' status (30-day duration), [10,000] user points. End of directive."
        }
    },
    {
        id: 'announcement-beta-1',
        type: 'announcement',
        title: "A Note on Our AI Assistant",
        message: "This is a beta version and our AI is still learning. We appreciate your understanding!",
        timestamp: new Date('2025-10-15T10:00:00Z').getTime(),
        isRead: false,
        personaMessages: {
            'blue-bird': "Hello! Just a quick feather-gram to let you know that I'm currently in a 'beta' phase. This means my circuits are still warming up, and I might occasionally get my wires crossed. I'm learning so much every day, though! Thank you for your patience as I grow my wings. I'm excited to become an even better assistant for you!",
            'green-leaf': "Greetings. A whisper from the woods: please be mindful that my connection to the digital forest is in its early bloom—a beta phase. Sometimes the leaves may obscure the path, and my wisdom might seem a bit hazy. I am grateful for your gentle patience as my roots grow deeper. The forest and I thank you.",
            'echo-bot': "[System Bulletin: AI Status - Beta] This unit is operating under beta protocols. Cognitive and functional parameters are not yet optimized. Occasional performance anomalies are within expected operational tolerances. Your interaction data is crucial for calibration. Thank you for your cooperation. End of bulletin."
        }
    }
];

let mockNotifications: Notification[] = [...defaultAnnouncements];
let listeners: Array<(notifications: Notification[]) => void> = [];

const notifyListeners = () => {
  for (const listener of listeners) {
    listener([...mockNotifications].sort((a, b) => b.timestamp - a.timestamp));
  }
};

export const subscribeToNotifications = (callback: (notifications: Notification[]) => void): (() => void) => {
  listeners.push(callback);
  // Immediately call with current notifications, sorted
  callback([...mockNotifications].sort((a, b) => b.timestamp - a.timestamp));

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: Date.now(),
    isRead: false,
  };
  mockNotifications = produce(mockNotifications, draft => {
    draft.push(newNotification);
  });
  notifyListeners();
  return newNotification;
};

export const markNotificationAsRead = (notificationId: string): void => {
    mockNotifications = produce(mockNotifications, draft => {
        const notification = draft.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
        }
    });
    notifyListeners();
};

export const markAllNotificationsAsRead = (): void => {
    mockNotifications = produce(mockNotifications, draft => {
        draft.forEach(n => {
            n.isRead = true;
        });
    });
    notifyListeners();
};

export const clearNotifications = (): void => {
  mockNotifications = [];
  notifyListeners();
};
