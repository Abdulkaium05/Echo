
// src/components/chat/select-verified-dialog.tsx
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
import { Loader2, AlertCircle, Crown, CheckCircle, Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getVerifiedUsers, type UserProfile, createChat, findChatBetweenUsers } from '@/services/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { CreatorLetterCBBadgeIcon } from './bot-icons';
import { VerifiedBadge } from '../verified-badge';
import { Input } from '../ui/input';

interface SelectVerifiedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  limit: number;
}

export function SelectVerifiedDialog({ isOpen, onOpenChange, limit }: SelectVerifiedDialogProps) {
  const { user, userProfile, updateMockUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [verifiedUsers, setVerifiedUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialSelection, setInitialSelection] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const isUnlimited = limit === Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSearchTerm('');
      // This is the fix: Only initialize with what's saved on the user profile.
      const currentSelection = userProfile?.selectedVerifiedContacts || [];
      setSelectedUsers(currentSelection);
      setInitialSelection(currentSelection);

      getVerifiedUsers()
        .then(users => {
          setVerifiedUsers(users.filter(u => u.uid !== user?.uid)); // Exclude self
        })
        .catch(err => {
          toast({ title: 'Error', description: 'Could not load verified users.', variant: 'destructive' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user?.uid, userProfile?.selectedVerifiedContacts, toast]);

  const handleSelect = (userId: string) => {
    // Prevent unselecting users who were part of the initial selection for this session
    if (initialSelection.includes(userId)) {
      toast({
        title: "Selection is Final",
        description: "You cannot remove already selected users during this subscription period.",
        variant: "default",
      });
      return;
    }

    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else if (prev.length < limit) {
        return [...prev, userId];
      } else {
        setTimeout(() => {
            toast({
              title: `Limit Reached (${limit})`,
              description: `You can only select up to ${limit} verified users with your current plan.`,
              variant: "destructive"
            });
        }, 0);
        return prev;
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
      // First, update the user profile. This is fast and will trigger UI updates.
      await updateMockUserProfile(user.uid, { 
          selectedVerifiedContacts: selectedUsers,
          hasMadeVipSelection: true,
      });

      // Close the dialog immediately for a better user experience.
      onOpenChange(false);
      setIsSaving(false);

      toast({
        title: "Selection Saved",
        description: !isUnlimited && selectedUsers.length >= limit
          ? "Your verified contact list is now full for this subscription."
          : `Your contact list has been updated. You can still select ${isUnlimited ? 'more' : limit - selectedUsers.length} more.`
      });

      // Then, handle the slower chat creation in the background.
      const newSelections = selectedUsers.filter(uid => !initialSelection.includes(uid));
      if (newSelections.length > 0) {
        // No need to await this promise chain, let it run in the background
        Promise.all(newSelections.map(async (uid) => {
          const chatExists = await findChatBetweenUsers(user.uid, uid);
          if (!chatExists) {
            await createChat(user.uid, uid);
          }
        })).catch(error => {
            console.error("Error creating chats in the background:", error);
             toast({
                title: "Background Error",
                description: "Could not create all new chat sessions. Please try again later or contact support.",
                variant: "destructive"
            });
        });
      }

    } catch (error: any) {
      toast({
        title: "Error Saving Selection",
        description: error.message || "Could not update your selection.",
        variant: "destructive"
      });
      setIsSaving(false);
    }
  };

  const selectionCount = selectedUsers.length;

  const filteredUsers = verifiedUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Verified Persons</DialogTitle>
            <DialogDescription>
              {isUnlimited
                ? "Select verified persons to chat with."
                : `Choose up to ${limit} verified persons to chat with. (${selectionCount}/${limit} selected)`}
              <br/>
              Selections are final for the duration of your subscription.
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
                    <p>No verified users found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  {filteredUsers.map(vUser => (
                    <div key={vUser.uid} 
                      className={cn(
                          "flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer",
                          selectedUsers.includes(vUser.uid) && "bg-accent/70",
                          initialSelection.includes(vUser.uid) && "opacity-60 cursor-not-allowed" // Style for locked-in users
                      )}
                      onClick={() => handleSelect(vUser.uid)}
                    >
                      <Checkbox
                        id={`user-${vUser.uid}`}
                        checked={selectedUsers.includes(vUser.uid)}
                        disabled={
                            initialSelection.includes(vUser.uid) || // Cannot change initial selections
                            (!selectedUsers.includes(vUser.uid) && selectedUsers.length >= limit) // Limit reached
                        }
                        className="pointer-events-none"
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={vUser.avatarUrl} alt={vUser.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{vUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Label
                        htmlFor={`user-${vUser.uid}`}
                        className={cn(
                            "flex-1 text-sm font-medium flex items-center gap-1.5",
                            initialSelection.includes(vUser.uid) ? "cursor-not-allowed" : "cursor-pointer"
                        )}
                      >
                        <span>{vUser.name}</span>
                        {vUser.isCreator && <CreatorLetterCBBadgeIcon className="h-4 w-4" />}
                        {vUser.isVIP && <Crown className="h-4 w-4 text-yellow-500" />}
                        {vUser.isVerified && !vUser.isCreator && <VerifiedBadge className="h-4 w-4" />}
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
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
