// src/components/profile/share-profile-dialog.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/context/auth-context";
import { QrCode, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { useToast } from "@/hooks/use-toast";

interface ShareProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function ShareProfileDialog({ isOpen, onOpenChange, user }: ShareProfileDialogProps) {
  const { toast } = useToast();

  if (!user) return null;

  const fallbackInitials = user.name ? user.name.substring(0, 2).toUpperCase() : '??';
  
  const qrValue = JSON.stringify({ type: "user_profile", uid: user.uid });
  
  const handleCopyId = () => {
    if (user.displayUid) {
      navigator.clipboard.writeText(user.displayUid);
      toast({ title: "Copied!", description: "Your User ID has been copied to the clipboard." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <Avatar className="h-20 w-20 mb-2 border-4 border-primary/20">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar"/>
            <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-xl">{user.name}</DialogTitle>
          <DialogDescription>
            Share this QR code to let others add you on Echo Message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-white rounded-lg flex items-center justify-center">
          <QRCode
            value={qrValue}
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
        
        {user.displayUid && (
          <div className="text-center text-sm text-muted-foreground">
            Or share your User ID: 
            <Button variant="link" className="p-1 h-auto" onClick={handleCopyId}>
              {user.displayUid} <Copy className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
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
