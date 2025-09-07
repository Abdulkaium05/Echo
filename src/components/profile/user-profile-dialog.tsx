
// src/components/profile/user-profile-dialog.tsx
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
import { Crown, Mail, MessageSquare, Loader2, Wrench, Bot, Cake, Clock, UserCircle2 } from "lucide-react";
import { CreatorLetterCBBadgeIcon, SquareBotBadgeIcon } from '@/components/chat/bot-icons';
import { useRouter } from "next/navigation";
import { findChatBetweenUsers, createChat, formatLastSeen } from '@/services/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "../verified-badge";

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
}

export function UserProfileDialog({ isOpen, onOpenChange, profile }: UserProfileDialogProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!profile) return null;

  const fallbackInitials = profile.name ? profile.name.substring(0, 2).toUpperCase() : '??';

  const handleStartOrViewChat = async () => {
    if (!currentUser || !profile) {
      toast({ title: "Error", description: "Cannot start chat. User information missing.", variant: "destructive" });
      return;
    }
    if (currentUser.uid === profile.uid) {
        toast({ title: "Cannot Chat Self", description: "You cannot start a chat with yourself.", variant: "default" });
        onOpenChange(false);
        return;
    }

    setIsProcessingChat(true);
    try {
      let chatId = await findChatBetweenUsers(currentUser.uid, profile.uid);
      if (!chatId) {
        chatId = await createChat(currentUser.uid, profile.uid);
        toast({ title: "Chat Created!", description: `Started a new chat with ${profile.name}.` });
      } else {
        toast({ title: "Chat Found", description: `Opening existing chat with ${profile.name}.` });
      }
      onOpenChange(false); // Close dialog
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not start/find chat: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingChat(false);
    }
  };

  const getProfileStatus = () => {
    if (profile.isBot) return "Automated Assistant";
    if (profile.isDevTeam) return "Echo Message Development Team";
    if (profile.isCreator && profile.isVIP) return "VIP Creator";
    if (profile.isCreator) return "Content Creator";
    if (profile.isVIP && profile.isVerified) return "VIP & Verified User";
    if (profile.isVIP) return "VIP Member";
    if (profile.isVerified) return "Verified User";
    return "Community Member";
  }

  const avatarHint = profile.isBot ? "blue bird" : (profile.isCreator ? "creator avatar" : "user avatar");
  const onlineStatus = formatLastSeen(profile.lastSeen);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
         <div className="relative">
             <div className={cn(
                "h-24 bg-gradient-to-br rounded-t-lg",
                profile.isCreator ? "from-purple-400/80 to-purple-300/60" : (profile.isVIP ? "from-primary/30 to-primary/20" : "from-secondary to-muted")
              )}>
              {/* Header background */}
            </div>
             <div 
                className="absolute top-0 left-0 w-full h-full"
                style={{ clipPath: 'ellipse(150% 100% at 50% 100%)', background: 'hsl(var(--card))' }}
            ></div>

            <div className="absolute top-12 left-1/2 -translate-x-1/2">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} data-ai-hint={avatarHint} />
                    <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                </Avatar>
            </div>
        </div>

        <div className="p-6 pt-16 flex flex-col gap-4">
            <DialogHeader className="items-center text-center">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 justify-center">
                    <span>{profile.name}</span>
                     <div className="flex items-center justify-center gap-1.5">
                        {profile.isDevTeam && <Wrench className="h-5 w-5 text-blue-600" title="Dev Team"/>}
                        {profile.isBot && <SquareBotBadgeIcon className="h-5 w-5" title="Bot"/>}
                        {!profile.isDevTeam && !profile.isBot && (
                            <>
                                {profile.isCreator && <CreatorLetterCBBadgeIcon className="h-5 w-5" title="Creator"/>}
                                {profile.isVIP && <Crown className="h-5 w-5 text-yellow-500" title="VIP"/>}
                                {profile.isVerified && !profile.isCreator && <VerifiedBadge className="h-5 w-5" title="Verified"/>}
                            </>
                        )}
                    </div>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 justify-center text-muted-foreground !mt-2">
                    <span className="text-sm font-medium text-foreground">{getProfileStatus()}</span>
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
                 {profile.displayUid && !profile.isBot && !profile.isDevTeam && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                        <UserCircle2 className="h-5 w-5 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground font-mono tracking-wider">{profile.displayUid}</span>
                    </div>
                 )}
                 {profile.email && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                        <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground">{profile.email}</span>
                    </div>
                 )}
                 {isClient && profile.createdAt && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                        <Cake className="h-5 w-5 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground">
                           Joined on {new Date(profile.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                    </div>
                 )}
                  <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                     <Clock className="h-5 w-5 text-muted-foreground mr-3" />
                     <span className={cn("text-muted-foreground", onlineStatus === 'Online' && 'text-green-600 font-medium')}>
                        {onlineStatus}
                     </span>
                 </div>
                 {profile.isVIP && profile.vipPack && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                         <Crown className="h-5 w-5 text-yellow-500 mr-3" />
                        <span className="text-primary font-semibold">VIP Pack: {profile.vipPack}</span>
                    </div>
                 )}
            </div>

            <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
                {currentUser?.uid !== profile.uid && !profile.isBot && (
                    <Button onClick={handleStartOrViewChat} disabled={isProcessingChat} className="w-full">
                        {isProcessingChat ? <Loader2 className="animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                        {isProcessingChat ? 'Processing...' : `Chat with ${profile.name}`}
                    </Button>
                )}
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full">
                    Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
