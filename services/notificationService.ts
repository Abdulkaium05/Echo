
'use client';
import { produce } from 'immer';

export interface Notification {
  id: string;
  type: 'welcome' | 'new_message' | 'system';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  relatedData?: {
    chatId?: string;
    senderId?: string;
  };
}

let mockNotifications: Notification[] = [];
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
