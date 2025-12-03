
// src/components/auth/complete-profile-dialog.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth, type UserProfile } from '@/context/auth-context';
import { uploadAvatar as uploadAvatarToStorage } from '@/services/storage';

interface CompleteProfileDialogProps {
  user: UserProfile;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CompleteProfileDialog({ user, onProfileUpdate, isOpen, onOpenChange }: CompleteProfileDialogProps) {
  const { toast } = useToast();
  const { storage: firebaseStorage } = useAuth();
  const [username, setUsername] = useState(user.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);
  const [newAvatarFile, setNewAvatarFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (!username.trim()) {
      toast({ title: "Username Required", description: "Please enter a username.", variant: "destructive" });
      return;
    }
    if (!avatarPreview) {
        toast({ title: "Avatar Required", description: "Please upload an avatar.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    let finalAvatarUrl = avatarPreview;

    try {
      if (newAvatarFile && firebaseStorage) {
        finalAvatarUrl = await uploadAvatarToStorage(firebaseStorage, user.uid, newAvatarFile);
      }

      await onProfileUpdate({
        name: username.trim(),
        avatarUrl: finalAvatarUrl,
        hasCompletedOnboarding: true,
      });

      toast({
        title: "Profile Complete!",
        description: "Welcome to Echo Message!",
      });
      onOpenChange(false);

    } catch (error: any) {
      console.error("[CompleteProfileDialog] Error saving profile:", error);
      toast({ title: "Save Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
      setIsLoading(true);
      try {
          await onProfileUpdate({
              hasCompletedOnboarding: true,
          });
          toast({
              title: "Profile Skipped",
              description: "You can update your profile later in the settings.",
          });
          onOpenChange(false);
      } catch (error: any) {
          console.error("[CompleteProfileDialog] Error skipping profile:", error);
          toast({ title: "Skip Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image smaller than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setNewAvatarFile(result);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };
  
  const fallbackInitials = username.substring(0, 2).toUpperCase() || user?.name?.substring(0, 2).toUpperCase() || '??';
  const isSaveDisabled = isLoading || !username.trim() || !avatarPreview;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" hideCloseButton>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            Choose a username and an avatar to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 flex flex-col items-center gap-6">
            <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-md">
                    <AvatarImage src={avatarPreview} alt={username} data-ai-hint="user avatar"/>
                    <AvatarFallback className="text-4xl">{fallbackInitials}</AvatarFallback>
                </Avatar>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isLoading} />
                <Button 
                    variant="default"
                    size="icon"
                    className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    aria-label="Change avatar"
                >
                    <Camera className="h-5 w-5" />
                </Button>
            </div>
            
            <div className="w-full space-y-2">
                <Label htmlFor="username-complete">Username</Label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="username-complete" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" disabled={isLoading} placeholder="Choose your username"/>
                </div>
            </div>
        </div>

        <div className="bg-secondary/50 p-4 border-t flex flex-col gap-2">
          <Button type="button" className="w-full" onClick={handleSave} disabled={isSaveDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save and Continue
          </Button>
           <Button type="button" variant="ghost" className="w-full" onClick={handleSkip} disabled={isLoading}>
              Skip for Now
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
