'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import {
  subscribeToNotifications,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications as clearAllNotifications,
  type Notification,
} from '@/services/notificationService';
import { useSound } from './sound-context';

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  addSystemNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isTabActive, setIsTabActive] = useState(true);
  const latestNotificationTimestampRef = useRef<number>(0);
  const { playSound } = useSound();

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      setIsTabActive(document.visibilityState === 'visible');
      const handleVisibilityChange = () => {
        setIsTabActive(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
    return () => {};
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotifications) => {
      
      const newLatestNotification = newNotifications.find(n => n.timestamp > latestNotificationTimestampRef.current);

      // If there's a new notification...
      if (newLatestNotification) {
          playSound('/sounds/notification.mp3');

          // ...and the tab is not active, show a browser notification
          if (
              !isTabActive &&
              typeof window !== 'undefined' && 'Notification' in window &&
              Notification.permission === 'granted'
          ) {
              try {
                  new Notification(newLatestNotification.title, {
                      body: newLatestNotification.message,
                      icon: '/logo.png', // Assuming you have a logo in public folder
                  });
              } catch (e) {
                  console.warn("Could not create notification:", e);
              }
          }
          latestNotificationTimestampRef.current = newLatestNotification.timestamp;
      }
      
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [isTabActive, playSound]);

  const addSystemNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    addNotification(notification);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
  }, []);
  
  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
  }, []);

  const clearNotifications = useCallback(() => {
    clearAllNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = {
    notifications,
    unreadCount,
    addSystemNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
