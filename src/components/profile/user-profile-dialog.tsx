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
import { Crown, Mail, MessageSquare, Loader2, Wrench, Bot, Cake, Clock, UserCircle2, SmilePlus, FlaskConical, Coins } from "lucide-react";
import { CreatorLetterCBBadgeIcon, SquareBotBadgeIcon, PioneerBadgeIcon, PatronBadgeIcon, CreatorLv2BadgeIcon, MemeCreatorLv2BadgeIcon, BetaTesterLv2BadgeIcon } from '@/components/chat/bot-icons';
import { useRouter } from "next/navigation";
import { findChatBetweenUsers, createChat, formatLastSeen } from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "../verified-badge";
import type { BadgeType } from "@/app/(app)/layout";

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
}

const BadgeComponents: Record<string, React.FC<{className?: string}>> = {
    creator: ({className}) => <CreatorLetterCBBadgeIcon className={cn("h-5 w-5", className)} />,
    vip: ({className}) => <Crown className={cn("h-5 w-5 text-yellow-500", className)} />,
    verified: ({className}) => <VerifiedBadge className={cn("h-5 w-5", className)} />,
    dev: ({className}) => <Wrench className={cn("h-5 w-5 text-blue-600", className)} />,
    bot: ({className}) => <SquareBotBadgeIcon className={cn("h-5 w-5", className)} />,
    meme_creator: ({className}) => <SmilePlus className={cn("h-5 w-5 text-green-500", className)} />,
    beta_tester: ({className}) => <FlaskConical className={cn("h-5 w-5 text-orange-500", className)} />,
    pioneer: ({className}) => <PioneerBadgeIcon className={cn("h-5 w-5", className)} />,
    patron: ({className}) => <PatronBadgeIcon className={cn("h-5 w-5", className)} />,
    creator_lv2: ({className}) => <CreatorLv2BadgeIcon className={cn("h-5 w-5", className)} />,
    meme_creator_lv2: ({className}) => <MemeCreatorLv2BadgeIcon className={cn("h-5 w-5", className)} />,
    beta_tester_lv2: ({className}) => <BetaTesterLv2BadgeIcon className={cn("h-5 w-5", className)} />,
};

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
      const existingChatId = await findChatBetweenUsers(currentUser.uid, profile.uid);
      if (existingChatId) {
        toast({ title: "Chat Found", description: `Opening existing chat with ${profile.name}.` });
      } else {
        await createChat(currentUser.uid, profile.uid);
        toast({ title: "Chat Created!", description: `Started a new chat with ${profile.name}.` });
      }
      onOpenChange(false); // Close dialog
      router.push(`/chat/${profile.uid}`); // Always navigate using partner's UID
    } catch (error: any) {
      toast({ title: "Error", description: `Could not start/find chat: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingChat(false);
    }
  };

  const getProfileStatus = () => {
    if (profile.isBot) return "Automated Assistant";
    if (profile.isPioneer) return "Developer 2.0";
    if (profile.isDevTeam) return "Developer";
    if (profile.isPatron) return "Verified 2.0";
    if (profile.isCreator && profile.isVIP) return "VIP Creator";
    if (profile.isCreator) return "Content Creator";
    if (profile.isVIP && profile.isVerified) return "VIP & Verified User";
    if (profile.isVIP) return "VIP Member";
    if (profile.isVerified) return "Verified User";
    return "Community Member";
  }

  const avatarHint = profile.isBot ? "blue bird" : (profile.isCreator ? "creator avatar" : "user avatar");
  const onlineStatus = isClient ? formatLastSeen(profile.lastSeen) : '...';
  const joinDate = isClient && profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : '...';

  const earnedBadges: BadgeType[] = [];
  if(profile.isCreator) earnedBadges.push('creator');
  if(profile.isCreatorLv2) earnedBadges.push('creator_lv2');
  if(profile.isVIP) earnedBadges.push('vip');
  if(profile.isPatron) earnedBadges.push('patron');
  else if(profile.isVerified) earnedBadges.push('verified');
  if(profile.isPioneer) earnedBadges.push('pioneer');
  else if(profile.isDevTeam) earnedBadges.push('dev');
  if(profile.isMemeCreatorLv2) earnedBadges.push('meme_creator_lv2');
  else if(profile.isMemeCreator) earnedBadges.push('meme_creator');
  if(profile.isBetaTesterLv2) earnedBadges.push('beta_tester_lv2');
  else if(profile.isBetaTester) earnedBadges.push('beta_tester');
  if(profile.isBot) earnedBadges.push('bot');

  const badgeDisplayOrder = profile.badgeOrder?.length ? profile.badgeOrder : [];
  const orderedBadges = badgeDisplayOrder.filter(badge => earnedBadges.includes(badge)).slice(0, 2);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
         <div className="relative">
             <div className={cn(
                "h-24 bg-gradient-to-br rounded-t-lg",
                profile.isPioneer || profile.isPatron ? "from-yellow-400/80 to-amber-300/60" :
                profile.isDevTeam ? "from-indigo-400/80 to-blue-300/60" : 
                (profile.isCreator ? "from-purple-400/80 to-purple-300/60" : 
                (profile.isVIP ? "from-primary/30 to-primary/20" : "from-secondary to-muted"))
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
                        {orderedBadges.map(badgeKey => {
                            const BadgeComponent = BadgeComponents[badgeKey];
                            return BadgeComponent ? <BadgeComponent key={badgeKey} /> : null;
                        })}
                    </div>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 justify-center text-muted-foreground !mt-2">
                    <span className="text-sm font-medium text-foreground">{getProfileStatus()}</span>
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
                 {profile.displayUid && !profile.isBot && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                        <UserCircle2 className="h-5 w-5 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground font-mono tracking-wider">{profile.displayUid}</span>
                    </div>
                 )}
                 <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                    <Coins className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-muted-foreground font-semibold">{profile.points || 0} Points</span>
                 </div>
                 {profile.createdAt && (
                    <div className="flex items-center text-sm p-3 rounded-md border bg-secondary/50">
                        <Cake className="h-5 w-5 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground">
                           Joined on {joinDate}
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
