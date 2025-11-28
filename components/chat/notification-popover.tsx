
// src/components/chat/notification-popover.tsx
'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
// This component now relies on a mock implementation since the service was removed.
// In a real app, this would come from a context.

const mockNotifications = [
    {id: '1', title: 'Welcome!', message: 'Thanks for joining Echo Message.', timestamp: Date.now() - 100000, isRead: false},
    {id: '2', title: 'New Message', message: 'You have a new message from Twaha.', timestamp: Date.now() - 200000, isRead: true},
];

export function NotificationPopover() {
  const notifications = mockNotifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mock functions
  const markAsRead = (id: string) => console.log('Marking as read:', id);
  const markAllAsRead = () => console.log('Marking all as read');

  return (
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
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={markAllAsRead}>
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
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                  )}
                  <div className={cn('flex-1', notif.isRead && 'pl-5')}>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
