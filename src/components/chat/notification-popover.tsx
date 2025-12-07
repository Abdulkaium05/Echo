
// src/components/chat/notification-popover.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox, Megaphone, Leaf } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/services/notificationService';
import { AnnouncementDialog } from './announcement-dialog';
import { OutlineBirdIcon } from './bot-icons';

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Notification | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    });
    return () => unsubscribe();
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.type === 'announcement' && notification.personaMessages) {
        setSelectedAnnouncement(notification);
    }
  };

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-medium">Notifications</h3>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={markAllNotificationsAsRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <Inbox className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">No Notifications</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-3 flex items-start gap-3 transition-colors hover:bg-accent/50 cursor-pointer',
                    !notif.isRead && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="pt-1">
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0"></div>
                      )}
                  </div>
                  <div className={cn('flex-1 -mt-1')}>
                     <p className="text-sm font-semibold flex items-center gap-1.5">
                        {notif.type === 'announcement' && <Megaphone className="h-4 w-4 text-primary" />}
                        {notif.title}
                     </p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notif.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <AnnouncementDialog
      isOpen={!!selectedAnnouncement}
      onOpenChange={() => setSelectedAnnouncement(null)}
      announcement={selectedAnnouncement}
    />
    </>
  );
}
