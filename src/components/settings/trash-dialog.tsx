
// src/components/settings/trash-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RotateCcw, Trash2, Inbox } from "lucide-react";
import { useTrash } from "@/context/trash-context";

interface TrashDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrashDialog({ isOpen, onOpenChange }: TrashDialogProps) {
  const { trashedChats, restoreChat } = useTrash();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Trash
          </DialogTitle>
          <DialogDescription>
            Deleted chats are stored here. You can restore them to your chat list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full -mx-6">
                <div className="px-6">
                {trashedChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                        <Inbox className="h-12 w-12 mb-3" />
                        <p className="font-medium">The trash is empty</p>
                        <p className="text-sm">Deleted chats will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                    {trashedChats.map(chat => (
                        <div key={chat.id} className="flex items-center gap-3 p-2 rounded-md border">
                        <Avatar>
                            <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="user avatar"/>
                            <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{chat.name}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreChat(chat.id)}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                        </Button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </ScrollArea>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
