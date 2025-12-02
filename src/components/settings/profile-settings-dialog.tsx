
// src/components/settings/profile-settings-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Upload, Loader2, Badge, Camera, Mail, User as UserIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth, type UserProfile } from '@/context/auth-context';
import { uploadAvatar as mockUploadAvatar } from '@/services/storage';
import { Separator } from '../ui/separator';
import { SelectBadgesDialog } from './select-badges-dialog';
import type { BadgeType } from '@/app/(app)/layout';
import { cn } from '@/lib/utils';


interface ProfileSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onProfileUpdate: (updatedData: Partial<UserProfile>) => Promise<void>;
}


export function ProfileSettingsDialog({ isOpen, onOpenChange, user, onProfileUpdate }: ProfileSettingsDialogProps) {
  const { toast } = useToast();
  const { user: authContextUser } = useAuth();
  const [currentUserName, setCurrentUserName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  
  const [tempBadgeOrder, setTempBadgeOrder] = useState<BadgeType[]>(user?.badgeOrder || []);

  useEffect(() => {
    if (isOpen && user) {
      setCurrentUserName(user.name || '');
      setAvatarPreview(user.avatarUrl);
      setNewAvatarFile(null);
      setTempBadgeOrder(user.badgeOrder || []);
      setIsLoading(false);
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!authContextUser || !user) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (!currentUserName.trim()) {
      toast({ title: "Invalid Input", description: "Username cannot be empty.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let finalAvatarUrl = avatarPreview;

    try {
      if (newAvatarFile) {
        finalAvatarUrl = await mockUploadAvatar(authContextUser.uid, newAvatarFile, newAvatarFile.type);
        toast({ title: "Avatar Processed", description: "Your new avatar has been processed." });
      }

      await onProfileUpdate({
        name: currentUserName.trim(),
        avatarUrl: finalAvatarUrl,
        badgeOrder: tempBadgeOrder,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
        action: <Check className="h-5 w-5 text-green-500" />,
      });
      onOpenChange(false);

    } catch (error: any) {
      console.error("[ProfileSettingsDialog] Error saving profile:", error);
      toast({ title: "Save Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image smaller than 2MB.' });
        return;
      }
      setNewAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        toast({ title: "Avatar Preview Updated", description: "Click 'Save changes' to apply." });
      };
      reader.onerror = () => toast({ variant: 'destructive', title: 'Error Reading File' });
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };
  
  const handleBadgeOrderSave = (newOrder: BadgeType[]) => {
    setTempBadgeOrder(newOrder);
    setIsBadgeDialogOpen(false);
  };

  const fallbackInitials = currentUserName.substring(0, 2).toUpperCase() || user?.name?.substring(0, 2).toUpperCase() || '??';

  const isSaveDisabled = isLoading || (
    !newAvatarFile &&
    currentUserName.trim() === (user?.name || '') &&
    JSON.stringify(tempBadgeOrder) === JSON.stringify(user?.badgeOrder || [])
  );
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
             <DialogHeader className="sr-only">
               <DialogTitle>Edit Profile</DialogTitle>
             </DialogHeader>
             <div className="relative">
                 <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/20 rounded-t-lg">
                    {/* Header background */}
                </div>
                 <div 
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ clipPath: 'ellipse(150% 100% at 50% 100%)', background: 'hsl(var(--card))' }}
                ></div>

                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                        <AvatarImage src={avatarPreview} alt={currentUserName || user?.name} data-ai-hint="user avatar"/>
                        <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                    </Avatar>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isLoading} />
                     <Button 
                        variant="default"
                        size="icon"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        onClick={handleChangeAvatarClick}
                        disabled={isLoading}
                        aria-label="Change avatar"
                     >
                        <Camera className="h-4 w-4" />
                     </Button>
                </div>
            </div>
          
            <div className="p-6 pt-16 flex flex-col gap-4">
                <h2 className="text-center text-2xl font-bold">{currentUserName || user?.name}</h2>

                <div className="space-y-3">
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="username-dialog" value={currentUserName} onChange={(e) => setCurrentUserName(e.target.value)} className="pl-10" disabled={isLoading} />
                    </div>
                    <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                         <Input id="email-dialog" value={user?.email || ''} className="pl-10 bg-secondary/50 border-secondary/50" disabled readOnly />
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <h3 className="font-semibold text-sm">Manage Badges</h3>
                     <p className="text-xs text-muted-foreground">Select and reorder your earned badges.</p>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsBadgeDialogOpen(true)} disabled={isLoading}>
                       <Badge className="mr-2 h-5 w-5" /> Select Badge
                    </Button>
                </div>
            </div>

          <DialogFooter className="bg-secondary/50 p-4 border-t flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button type="button" className="w-full" onClick={handleSave} disabled={isSaveDisabled}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
             <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full" disabled={isLoading}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user && (
        <SelectBadgesDialog
            isOpen={isBadgeDialogOpen}
            onOpenChange={setIsBadgeDialogOpen}
            userProfile={user}
            onSave={handleBadgeOrderSave}
        />
      )}
    </>
  );
}
