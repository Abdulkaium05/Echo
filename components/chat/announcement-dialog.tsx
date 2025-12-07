
// src/components/chat/announcement-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Leaf, Megaphone } from "lucide-react";
import { type Notification } from "@/services/notificationService";
import { OutlineBirdIcon } from "./bot-icons";

interface AnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Notification | null;
}

export function AnnouncementDialog({ isOpen, onOpenChange, announcement }: AnnouncementDialogProps) {
  if (!announcement || !announcement.personaMessages) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[80vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcement
          </DialogTitle>
          <DialogDescription>
            {announcement.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="blue-bird" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blue-bird">
              <OutlineBirdIcon className="h-5 w-5 text-sky-500"/>
            </TabsTrigger>
            <TabsTrigger value="green-leaf">
              <Leaf className="h-5 w-5 text-green-500"/>
            </TabsTrigger>
            <TabsTrigger value="echo-bot">
              <Bot className="h-5 w-5 text-foreground/70"/>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full pr-4">
              <TabsContent value="blue-bird" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-0">
                {announcement.personaMessages['blue-bird']}
              </TabsContent>
              <TabsContent value="green-leaf" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-0">
                {announcement.personaMessages['green-leaf']}
              </TabsContent>
              <TabsContent value="echo-bot" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-0 font-mono">
                {announcement.personaMessages['echo-bot']}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
