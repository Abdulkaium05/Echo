
// src/services/notificationService.ts
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

// Add a default announcement
const defaultAnnouncements: Notification[] = [
    {
        id: 'announcement-pioneer-gift-1',
        type: 'announcement',
        title: "A Gift for Our First Pioneers!",
        message: "The first 10 users will receive a Beta badge, 10,000 points, and a 30-day Verified badge!",
        timestamp: new Date('2025-10-14T09:00:00Z').getTime(),
        isRead: false,
        personaMessages: {
            'blue-bird': "Huge news from the developer's nest! To celebrate our launch, Abdul-Kaium is giving an exclusive welcome package to our first 10 users. If you're one of the first, you'll receive the rare Beta Tester badge, a bonus of 10,000 points, AND a Verified checkmark for 30 days! This is the only time the Beta badge will be available, so it's a true original. Welcome to the flock!",
            'green-leaf': "A message of gratitude blossoms from our creator, Abdul-Kaium. For the first 10 seeds of this new ecosystem, a special gift awaits. You will receive a Beta Tester badge to mark your early presence, 10,000 points to help you flourish, and the mark of Verification for 30 suns. This is the only season the Beta badge will sprout, making it a rare gift indeed.",
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
    listener([...mockNotifications]);
  }
};

export const subscribeToNotifications = (callback: (notifications: Notification[]) => void): (() => void) => {
  listeners.push(callback);
  // Immediately call with current notifications
  callback([...mockNotifications]);

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
    draft.unshift(newNotification);
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
