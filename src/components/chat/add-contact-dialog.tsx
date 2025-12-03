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
import { findUserByDisplayUid, findChatBetweenUsers, createChat } from '@/services/firestore';
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
  const [contactUid, setContactUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false); // State for ScanQrDialog

  const handleAddContact = async () => {
    if (!contactUid.trim()) {
      toast({ title: "Invalid User ID", description: "Please enter a valid User ID.", variant: "destructive" });
      return;
    }
    if (!currentUserId || !currentUserProfile) {
       toast({ title: "Error", description: "Cannot add contact. User not identified.", variant: "destructive" });
       return;
    }

    setIsLoading(true);
    console.log(`AddContactDialog: Adding contact with User ID ${contactUid} for user ${currentUserId}.`);

    try {
      const targetUser = await findUserByDisplayUid(contactUid.trim());

      if (!targetUser) {
        toast({ title: "User Not Found", description: `No user found with User ID ${contactUid}.`, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (targetUser.uid === currentUserId) {
          toast({ title: "Cannot Add Self", description: "You cannot add yourself as a contact.", variant: "destructive" });
          setIsLoading(false);
          return;
      }
      
      const isTargetUserVerifiedOrDev = (targetUser.isVerified) && !targetUser.isBot;

      if (isTargetUserVerifiedOrDev) {
          if (!hasVipAccess) {
               toast({
                title: "VIP Required",
                description: "This is a verified user. You must be a VIP member to start a conversation.",
                variant: "destructive",
                duration: 7000,
                action: <ShieldAlert className="h-5 w-5" />,
              });
              setIsLoading(false);
              return;
          }
      }


      let chatId = await findChatBetweenUsers(currentUserId, targetUser.uid);

      if (chatId) {
         toast({ title: "Chat Exists", description: `You already have a chat with ${targetUser.name || 'this user'}.` });
         onOpenChange(false);
         setContactUid('');
         router.push(`/chat/${targetUser.uid}`);
         return; 
      } else {
         chatId = await createChat(currentUserId, targetUser.uid);
         toast({
           title: "Chat Created!",
           description: `Started a chat with ${targetUser.name || 'this user'}. It will appear in your list shortly.`,
           action: <UserPlus className="h-5 w-5 text-green-500" />,
         });
      }
      
      onOpenChange(false);
      setContactUid('');
      router.push(`/chat/${targetUser.uid}`); // Navigate to chat using partner's UID

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
     setContactUid('');
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
              Scan a QR code or enter a User ID to start a new chat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Button variant="outline" className="w-full h-12" onClick={handleOpenScanner}>
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code
            </Button>
            
            <div className="flex items-center">
                <Separator className="flex-1" />
                <span className="px-4 text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-uid-dialog" className="text-muted-foreground">Enter User ID</Label>
                <Input
                id="contact-uid-dialog"
                type="text"
                placeholder="e.g, john.doe.123"
                value={contactUid}
                onChange={(e) => setContactUid(e.target.value)}
                className="mt-1"
                disabled={isLoading}
                />
            </div>
          </div>
          
          <DialogFooter className="mt-2">
            <DialogClose asChild>
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleAddContact} disabled={isLoading || !contactUid.trim()}>
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
