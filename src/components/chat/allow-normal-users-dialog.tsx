// src/components/chat/allow-normal-users-dialog.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, Search, User as UserIcon, X } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { findUserByDisplayUid, type UserProfile } from '@/services/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface AllowNormalUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllowNormalUsersDialog({ isOpen, onOpenChange }: AllowNormalUsersDialogProps) {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [allowedUsers, setAllowedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchUid, setSearchUid] = useState('');
  const [isFindingUser, setIsFindingUser] = useState(false);

  // Fetch full profiles for initially allowed UIDs
  const fetchInitialUsers = useCallback(async () => {
    if (!userProfile?.allowedNormalContacts?.length) {
      setAllowedUsers([]);
      return;
    }
    setIsLoading(true);
    const profiles = await Promise.all(
      userProfile.allowedNormalContacts.map(uid => findUserByDisplayUid(String(uid)))
    );
    setAllowedUsers(profiles.filter((p): p is UserProfile => p !== null));
    setIsLoading(false);
  }, [userProfile?.allowedNormalContacts]);

  useEffect(() => {
    if (isOpen && userProfile) {
      fetchInitialUsers();
    }
  }, [isOpen, userProfile, fetchInitialUsers]);

  const handleAddUser = async () => {
    const uidToFind = String(searchUid).trim();
    if (!uidToFind) return;

    if (allowedUsers.some(u => u.displayUid === uidToFind)) {
      toast({ title: 'User Already Added', variant: 'destructive' });
      return;
    }
    setIsFindingUser(true);
    try {
      const foundUser = await findUserByDisplayUid(uidToFind);
      if (foundUser) {
        if (foundUser.uid === user?.uid) {
          toast({ title: 'Cannot Add Self', variant: 'destructive'});
          return;
        }
        if (foundUser.isVerified || foundUser.isCreator) {
            toast({ title: 'Cannot Add This User', description: 'This user is not a normal user.', variant: 'destructive'});
            return;
        }
        setAllowedUsers(prev => [...prev, foundUser]);
        setSearchUid('');
      } else {
        toast({ title: 'User Not Found', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error Finding User', variant: 'destructive' });
    } finally {
      setIsFindingUser(false);
    }
  };
  
  const handleRemoveUser = (uid: string) => {
    setAllowedUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleConfirm = async () => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    
    try {
      const allowedUids = allowedUsers.map(u => u.uid);
      await updateUserProfile({ 
          allowedNormalContacts: allowedUids,
      });
      
      onOpenChange(false);
      
      toast({
        title: "Allow List Updated",
        description: "Your list of allowed users has been saved."
      });

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Allow Users to Contact You</DialogTitle>
          <DialogDescription>
            Add normal users by their User ID to permit them to send you a message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Enter user ID..."
                    className="pl-9"
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                    disabled={isFindingUser}
                />
            </div>
            <Button onClick={handleAddUser} disabled={isFindingUser || !searchUid.trim()}>
                {isFindingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="pr-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : allowedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 text-center">
                    <AlertCircle className="h-8 w-8 mb-2"/>
                    <p>No users have been allowed yet.</p>
                     <p className="text-xs mt-1">Add users by their ID above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allowedUsers.map(vUser => (
                    <div key={vUser.uid} className="flex items-center space-x-3 p-2 rounded-md border">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={vUser.avatarUrl} alt={vUser.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{vUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{vUser.name}</p>
                        <p className="text-xs text-muted-foreground">{vUser.displayUid}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveUser(vUser.uid)}>
                        <X className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
