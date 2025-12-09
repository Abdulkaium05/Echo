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
import { CreatorLetterCBBadgeIcon, PioneerBadgeIcon, PatronBadgeIcon, CreatorLv2BadgeIcon, MemeCreatorLv2BadgeIcon, BetaTesterLv2BadgeIcon } from '../chat/bot-icons';
import { VerifiedBadge } from '../verified-badge';
import type { BadgeType } from '@/app/(app)/layout';
import { ScrollArea } from '../ui/scroll-area';

interface SelectBadgesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  onSave: (newOrder: BadgeType[]) => void;
}

const badgeDisplayPriority: BadgeType[] = ['pioneer', 'patron', 'dev', 'creator_lv2', 'creator', 'verified', 'vip', 'meme_creator_lv2', 'meme_creator', 'beta_tester_lv2', 'beta_tester', 'bot'];

const badgeComponentMap: Record<string, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  creator_lv2: CreatorLv2BadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
  meme_creator: (props) => <SmilePlus {...props} />,
  meme_creator_lv2: MemeCreatorLv2BadgeIcon,
  beta_tester: (props) => <FlaskConical {...props} />,
  beta_tester_lv2: BetaTesterLv2BadgeIcon,
  pioneer: PioneerBadgeIcon,
  patron: PatronBadgeIcon,
};

const badgeLabelMap: Record<string, string> = {
  creator: "Creator",
  creator_lv2: "Creator Lvl 2",
  vip: "VIP",
  verified: "Verified",
  dev: "Developer",
  bot: "Bot",
  meme_creator: "Meme Creator",
  meme_creator_lv2: "Meme Creator Lvl 2",
  beta_tester: "Beta Tester",
  beta_tester_lv2: "Beta Tester Lvl 2",
  pioneer: "Developer 2.0",
  patron: "Verified 2.0",
  feature_suggestion_approved: "Suggestion Approved",
};


const EarnedBadges = (userProfile: UserProfile): Set<BadgeType> => {
    const badges = new Set<BadgeType>();
    if (userProfile.isCreator) badges.add('creator');
    if (userProfile.isCreatorLv2) badges.add('creator_lv2');
    if (userProfile.isVIP) badges.add('vip');
    if (userProfile.isVerified) badges.add('verified');
    if (userProfile.isDevTeam) badges.add('dev');
    if (userProfile.isBot) badges.add('bot');
    if (userProfile.isMemeCreator) badges.add('meme_creator');
    if (userProfile.isMemeCreatorLv2) badges.add('meme_creator_lv2');
    if (userProfile.isBetaTester) badges.add('beta_tester');
    if (userProfile.isBetaTesterLv2) badges.add('beta_tester_lv2');
    if (userProfile.isPioneer) badges.add('pioneer');
    if (userProfile.isPatron) badges.add('patron');
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
  
  // Filter and sort the badges to be displayed
  const displayableBadges = badgeDisplayPriority.filter(badge => earnedBadges.has(badge));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Badges</DialogTitle>
          <DialogDescription>
            Click to select badges. The selection order determines display order.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="grid grid-cols-3 gap-3 py-4">
            {displayableBadges.map((badgeKey) => {
              const BadgeIcon = badgeComponentMap[badgeKey as keyof typeof badgeComponentMap];
              if (!BadgeIcon) return null;
              const isSelected = selectedBadges.includes(badgeKey);
              const selectionNumber = isSelected ? selectedBadges.indexOf(badgeKey) + 1 : null;
              
              return (
                  <div 
                    key={badgeKey}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 aspect-square group cursor-pointer",
                      isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                      "active:scale-95 active:duration-100"
                    )}
                    onClick={() => handleBadgeClick(badgeKey)}
                  >
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
                    <span className="mt-2 text-center text-xs font-medium">{badgeLabelMap[badgeKey as keyof typeof badgeLabelMap]}</span>
                    
                  </div>
              );
            })}
          </div>
        </ScrollArea>

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
