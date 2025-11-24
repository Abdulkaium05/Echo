
// src/components/chat/allow-normal-users-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getNormalUsers, type UserProfile, createChat, findChatBetweenUsers, sendMessage } from '@/services/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

interface AllowNormalUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllowNormalUsersDialog({ isOpen, onOpenChange }: AllowNormalUsersDialogProps) {
  const { user, userProfile, updateMockUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [normalUsers, setNormalUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [initialSelection, setInitialSelection] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && userProfile) {
      setIsLoading(true);
      setSearchTerm('');
      const currentSelection = userProfile.allowedNormalContacts || [];
      setSelectedUsers(currentSelection);
      setInitialSelection(currentSelection);

      getNormalUsers()
        .then(users => {
          setNormalUsers(users.filter(u => u.uid !== user?.uid)); // Exclude self
        })
        .catch(err => {
          toast({ title: 'Error', description: 'Could not load users.', variant: 'destructive' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user?.uid, userProfile, toast]);

  const handleSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleConfirm = async () => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Error", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    
    try {
      // First, update the user's profile with the new list of allowed contacts.
      updateMockUserProfile(user.uid, { 
          allowedNormalContacts: selectedUsers,
      });
      
      // Close the dialog immediately for a better user experience.
      onOpenChange(false);
      
      toast({
        title: "Allow List Updated",
        description: "Your list of allowed users has been saved."
      });

      // In the background, process newly added users
      const newlySelectedUsers = selectedUsers.filter(uid => !initialSelection.includes(uid));
      if (newlySelectedUsers.length > 0) {
          console.log(`[AllowUsersDialog] Processing chats for ${newlySelectedUsers.length} new users.`);
          
          for (const uid of newlySelectedUsers) {
              let chatId = await findChatBetweenUsers(user.uid, uid);
              if (!chatId) {
                  console.log(`[AllowUsersDialog] Creating new chat with user ${uid}.`);
                  chatId = await createChat(user.uid, uid);
                  console.log(`[AllowUsersDialog] Created new chat ${chatId} and sending initial message.`);
                  await sendMessage(chatId, user.uid, "You can now message me.");
              } else {
                  console.log(`[AllowUsersDialog] Chat with user ${uid} already exists (${chatId}). No new message sent.`);
              }
          }
      }

    } catch (error: any) {
      toast({
        title: "Error Saving Selection",
        description: error.message || "Could not update your selection.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = normalUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Allow Users to Contact You</DialogTitle>
            <DialogDescription>
              Select which normal users are permitted to send you a message.
            </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
            <div className="pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <AlertCircle className="h-8 w-8 mb-2"/>
                    <p>No users found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  {filteredUsers.map(vUser => (
                    <div key={vUser.uid} 
                      className={cn(
                          "flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer",
                          selectedUsers.includes(vUser.uid) && "bg-accent/70",
                      )}
                      onClick={() => handleSelect(vUser.uid)}
                    >
                      <Checkbox
                        id={`user-${vUser.uid}`}
                        checked={selectedUsers.includes(vUser.uid)}
                        className="pointer-events-none"
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={vUser.avatarUrl} alt={vUser.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{vUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Label
                        htmlFor={`user-${vUser.uid}`}
                        className={cn(
                            "flex-1 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                        )}
                      >
                        <span>{vUser.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
