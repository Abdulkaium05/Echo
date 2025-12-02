
// src/components/chat/add-contact-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, ShieldAlert, QrCode } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { findUserByDisplayId, findChatBetweenUsers, createChat } from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { useVIP } from '@/context/vip-context';
import { ScanQrDialog } from './scan-qr-dialog'; // Import the new component
import { Separator } from '../ui/separator';

interface AddContactDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function AddContactDialog({ isOpen, onOpenChange, currentUserId }: AddContactDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile: currentUserProfile } = useAuth();
  const { hasVipAccess } = useVIP();
  const [contactId, setContactId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false); // State for ScanQrDialog

  const handleAddContact = async () => {
    if (!contactId.trim()) {
      toast({ title: "Invalid User ID", description: "Please enter a valid User ID.", variant: "destructive" });
      return;
    }
    if (!currentUserId || !currentUserProfile) {
       toast({ title: "Error", description: "Cannot add contact. User not identified.", variant: "destructive" });
       return;
    }

    setIsLoading(true);
    console.log(`AddContactDialog: Adding contact with User ID ${contactId} for user ${currentUserId}.`);

    try {
      const targetUser = await findUserByDisplayId(contactId);

      if (!targetUser) {
        toast({ title: "User Not Found", description: `No user found with ID "${contactId}".`, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (targetUser.uid === currentUserId) {
          toast({ title: "Cannot Add Self", description: "You cannot add yourself as a contact.", variant: "destructive" });
          setIsLoading(false);
          return;
      }
      
      const isTargetUserVerifiedOrDev = (targetUser.isVerified || targetUser.isDevTeam) && !targetUser.isBot;

      if (isTargetUserVerifiedOrDev) {
          const isCurrentUserAllowedByTarget = targetUser.allowedNormalContacts?.includes(currentUserId);

          if (!hasVipAccess && !isCurrentUserAllowedByTarget) {
               toast({
                title: "VIP Required",
                description: "This is a verified user. You must either be a VIP member or be specifically allowed by them to start a conversation.",
                variant: "destructive",
                duration: 7000,
                action: <ShieldAlert className="h-5 w-5" />,
              });
              setIsLoading(false);
              return;
          }
      }


      const existingChatId = await findChatBetweenUsers(currentUserId, targetUser.uid);

      if (existingChatId) {
         toast({ title: "Chat Exists", description: `You already have a chat with ${targetUser.name || 'this user'}. Redirecting...`, variant: "default" });
         onOpenChange(false);
         router.push(`/chat/${existingChatId}`);
      } else {
         const newChatId = await createChat(currentUserId, targetUser.uid);
         toast({
           title: "Chat Created!",
           description: `Started a chat with ${targetUser.name || 'this user'}. Redirecting...`,
           action: <UserPlus className="h-5 w-5 text-green-500" />,
         });
         onOpenChange(false);
         router.push(`/chat/${newChatId}`);
      }
      setContactId('');
    } catch (error: any) {
      console.error("AddContactDialog: Error adding contact:", error);
      toast({
        title: "Error Adding Contact",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
     setContactId('');
     onOpenChange(false);
  };

  const handleOpenScanner = () => {
    onOpenChange(false); // Close this dialog
    setIsScanQrOpen(true); // Open the scanner dialog
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Add New Contact
            </DialogTitle>
            <DialogDescription>
              Add a new person to your chat list by their User ID or by scanning their QR code.
            </DialogDescription>
          </DialogHeader>
          
          <Button variant="outline" className="w-full" onClick={handleOpenScanner}>
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
          
          <div className="flex items-center my-2">
            <Separator className="flex-1" />
            <span className="px-2 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-id-dialog">User ID</Label>
            <Input
              id="contact-id-dialog"
              type="text"
              placeholder="e.g, abdul.kaium.05"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleAddContact} disabled={isLoading || !contactId.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Adding...' : 'Add Contact'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ScanQrDialog 
        isOpen={isScanQrOpen}
        onOpenChange={setIsScanQrOpen}
      />
    </>
  );
}
