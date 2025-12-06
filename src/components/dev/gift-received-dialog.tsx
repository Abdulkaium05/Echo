
// src/components/dev/gift-received-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/context/auth-context";
import { Crown, Bot, Wrench, SmilePlus, FlaskConical, PartyPopper, Check, Gift, Rocket, Gem } from "lucide-react";
import { CreatorLetterCBBadgeIcon } from '@/components/chat/bot-icons';
import { VerifiedBadge } from "@/components/verified-badge";
import { cn } from "@/lib/utils";
import type { BadgeType } from "@/app/(app)/layout";

interface GiftReceivedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gifterProfile: UserProfile | null;
  giftedBadge: BadgeType | null;
}

const badgeComponentMap: Record<string, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
  pioneer: (props) => <Rocket {...props} />,
  patron: (props) => <Gem {...props} />,
};

const badgeLabelMap: Record<string, string> = {
  creator: "Creator",
  vip: "VIP",
  verified: "Verified",
  dev: "Developer",
  bot: "Bot",
  meme_creator: "Meme Creator",
  beta_tester: "Beta Tester",
  pioneer: "Pioneer",
  patron: "Patron",
};


export function GiftReceivedDialog({ isOpen, onOpenChange, gifterProfile, giftedBadge }: GiftReceivedDialogProps) {

  if (!gifterProfile || !giftedBadge) return null;

  const GifterBadgeIcon = badgeComponentMap[gifterProfile.badgeOrder?.[0] || 'dev'];
  const GiftedBadgeIcon = badgeComponentMap[giftedBadge];
  
  const gifterFallback = gifterProfile.name.substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center space-y-4">
            <div className="relative">
                <PartyPopper className="h-16 w-16 text-primary animate-pulse" strokeWidth={1.5} />
                <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-full shadow-md">
                    <Gift className="h-6 w-6 text-pink-500" />
                </div>
            </div>
          <DialogTitle className="text-2xl font-bold">Congratulations!</DialogTitle>
          <div className="text-muted-foreground">
            You've received the{' '}
            <span className="font-semibold text-primary inline-flex items-center gap-1.5">
                <GiftedBadgeIcon className="h-4 w-4" />
                {badgeLabelMap[giftedBadge]}
            </span>
            {' '}badge!
          </div>
        </DialogHeader>
        
        <div className="pt-4 pb-2">
            <div className="text-sm text-center text-muted-foreground mb-3">Gifted by:</div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary border">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={gifterProfile.avatarUrl} alt={gifterProfile.name} data-ai-hint="user avatar" />
                    <AvatarFallback className="text-2xl">{gifterFallback}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{gifterProfile.name}</span>
                    {GifterBadgeIcon && <GifterBadgeIcon className="h-5 w-5" />}
                </div>
            </div>
        </div>
        
        <DialogFooter>
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              Awesome!
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
