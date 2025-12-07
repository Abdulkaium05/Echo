// src/components/settings/select-badges-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Crown, Bot, Wrench, SmilePlus, FlaskConical, Lock } from "lucide-react";
import { useAuth, type UserProfile } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { CreatorLetterCBBadgeIcon } from '../chat/bot-icons';
import { VerifiedBadge } from '../verified-badge';
import type { BadgeType } from '@/app/(app)/layout';

interface SelectBadgesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  onSave: (newOrder: BadgeType[]) => void;
}

const allPossibleBadges: BadgeType[] = ['creator', 'vip', 'verified', 'dev', 'bot', 'meme_creator', 'beta_tester'];

const badgeComponentMap: Record<Exclude<BadgeType, 'feature_suggestion_approved'>, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
};

const badgeLabelMap: Record<BadgeType, string> = {
  creator: "Creator",
  vip: "VIP",
  verified: "Verified",
  dev: "Developer",
  bot: "Bot",
  meme_creator: "Meme Creator",
  beta_tester: "Beta Tester",
  feature_suggestion_approved: "Suggestion Approved",
};


const EarnedBadges = (userProfile: UserProfile) => {
    const badges = new Set<BadgeType>();
    if (userProfile.isCreator) badges.add('creator');
    if (userProfile.isVIP) badges.add('vip');
    if (userProfile.isVerified) badges.add('verified');
    if (userProfile.isDevTeam) badges.add('dev');
    if (userProfile.isBot) badges.add('bot');
    if (userProfile.isMemeCreator) badges.add('meme_creator');
    if (userProfile.isBetaTester) badges.add('beta_tester');
    return badges;
};

export function SelectBadgesDialog({ isOpen, onOpenChange, userProfile, onSave }: SelectBadgesDialogProps) {
  const [selectedBadges, setSelectedBadges] = useState<BadgeType[]>([]);
  const earnedBadges = useMemo(() => EarnedBadges(userProfile), [userProfile]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with the user's current preference, but only include earned badges
      const currentOrder = userProfile.badgeOrder || [];
      setSelectedBadges(currentOrder.filter(b => earnedBadges.has(b)));
    }
  }, [isOpen, userProfile.badgeOrder, earnedBadges]);


  const handleBadgeClick = (badge: BadgeType) => {
    if (!earnedBadges.has(badge)) return; // Can't select unearned badges

    setSelectedBadges(prev => {
      if (prev.includes(badge)) {
        return prev.filter(b => b !== badge); // Deselect
      } else {
        return [...prev, badge]; // Select and add to the end of the order
      }
    });
  };
  
  const handleConfirm = () => {
    onSave(selectedBadges);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Badges</DialogTitle>
          <DialogDescription>
            Click to select badges. The selection order determines display order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {allPossibleBadges.map((badgeKey) => {
            const BadgeIcon = badgeComponentMap[badgeKey as Exclude<BadgeType, 'feature_suggestion_approved'>];
            if (!BadgeIcon) return null;
            const hasBadge = earnedBadges.has(badgeKey);
            const isSelected = selectedBadges.includes(badgeKey);
            const selectionNumber = isSelected ? selectedBadges.indexOf(badgeKey) + 1 : null;
            
            return (
                <div 
                  key={badgeKey}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 aspect-square group",
                    hasBadge ? "cursor-pointer" : "opacity-50 cursor-not-allowed bg-muted/30",
                    isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                    hasBadge && "active:scale-95 active:duration-100"
                  )}
                  onClick={() => handleBadgeClick(badgeKey)}
                >
                  {!hasBadge && (
                    <div className="absolute top-1.5 right-1.5">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {isSelected && (
                     <div className={cn(
                        "absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold transition-transform duration-200",
                        "group-active:scale-110"
                     )}>
                        {selectionNumber}
                     </div>
                  )}

                  <BadgeIcon className={cn(
                    "h-8 w-8 transition-transform duration-300 group-hover:scale-110",
                    badgeKey === 'vip' && 'text-yellow-500', 
                    badgeKey === 'dev' && 'text-blue-600', 
                    badgeKey === 'bot' && 'text-sky-500', 
                    badgeKey === 'meme_creator' && 'text-green-500', 
                    badgeKey === 'beta_tester' && 'text-orange-500'
                  )} />
                  <span className="mt-2 text-center text-xs font-medium">{badgeLabelMap[badgeKey]}</span>
                  
                </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
