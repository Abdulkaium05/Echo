
// src/components/chat/allow-normal-users-dialog.tsx
'use client';

import { useState } from 'react';
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
import { Loader2, AlertCircle, UserSearch, UserPlus, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { type UserProfile, createChat, findChatBetweenUsers, sendMessage, findUserByDisplayId } from '@/services/firestore';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AllowNormalUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function AllowedUserItem({ uid, onRemove }: { uid: string; onRemove: (uid: string) => void; }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    useEffect(() => {
        findUserByDisplayId(uid).then(setProfile);
    }, [uid]);

    if (!profile) {
        return (
            <div className="flex items-center p-2 rounded-md border animate-pulse">
                <div className="h-9 w-9 bg-muted rounded-full mr-3"></div>
                <div className="h-4 w-24 bg-muted rounded-md"></div>
            </div>
        )
    }

    return (
        <div className="flex items-center p-2 rounded-md border">
            <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback>{profile.name.substring(0,2)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium text-sm">{profile.name}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemove(uid)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    )
}

export function AllowNormalUsersDialog({ isOpen, onOpenChange }: AllowNormalUsersDialogProps) {
  const { user, userProfile, updateMockUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [userIdInput, setUserIdInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const allowedUsersProfiles = (userProfile?.allowedNormalContacts || [])
    .map(uid => findUserByDisplayId(uid).then(p => p)) // This is a bit of a hack, ideally we'd fetch all at once
    .filter(Boolean) as (UserProfile | Promise<UserProfile | null>)[]; 

  const handleAddUser = async () => {
    if (!user || !userProfile) {
        toast({ title: "Authentication Error", variant: "destructive" });
        return;
    }
    if (!userIdInput.trim()) {
        toast({ title: "User ID required", description: "Please enter a user's ID.", variant: "destructive" });
        return;
    }
    setIsProcessing(true);
    try {
        const targetUser = await findUserByDisplayId(String(userIdInput).trim());

        if (!targetUser) {
            throw new Error("User not found.");
        }
        if (targetUser.isVerified || targetUser.isDevTeam || targetUser.isBot || targetUser.isCreator) {
            throw new Error("This user is not a normal user and cannot be added here.");
        }
        if (userProfile.allowedNormalContacts?.includes(targetUser.uid)) {
            throw new Error(`${targetUser.name} is already on your allowed list.`);
        }

        const newAllowedList = [...(userProfile.allowedNormalContacts || []), targetUser.uid];
        updateMockUserProfile(user.uid, { allowedNormalContacts: newAllowedList });

        // Create chat and send message in the background
        const chatId = await findChatBetweenUsers(user.uid, targetUser.uid) || await createChat(user.uid, targetUser.uid);
        await sendMessage(chatId, user.uid, "You can now message me.");
        
        toast({ title: "User Added", description: `${targetUser.name} can now contact you.` });
        setUserIdInput('');

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRemoveUser = async (uidToRemove: string) => {
    if (!user || !userProfile) {
        toast({ title: "Authentication Error", variant: "destructive" });
        return;
    }
     const newAllowedList = (userProfile.allowedNormalContacts || []).filter(uid => uid !== uidToRemove);
     await updateMockUserProfile(user.uid, { allowedNormalContacts: newAllowedList });
     toast({ title: "User Removed", description: "This user can no longer initiate chats with you.", variant: "destructive" });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Allow Users to Contact You</DialogTitle>
            <DialogDescription>
              Add specific users by their ID to grant them permission to start a conversation with you.
            </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input 
                    placeholder="Enter User ID..."
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    disabled={isProcessing}
                />
                <Button onClick={handleAddUser} disabled={isProcessing || !userIdInput.trim()}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        <div className="flex-1 min-h-0 border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Allowed Users ({userProfile?.allowedNormalContacts?.length || 0})</h4>
            <ScrollArea className="h-full pr-4 -mr-4">
            <div className="">
              {!userProfile?.allowedNormalContacts || userProfile.allowedNormalContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 text-center">
                    <AlertCircle className="h-8 w-8 mb-2"/>
                    <p className="text-sm">Your allowed list is empty.</p>
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {userProfile.allowedNormalContacts.map(uid => (
                    <AllowedUserItem key={uid} uid={uid} onRemove={handleRemoveUser} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
