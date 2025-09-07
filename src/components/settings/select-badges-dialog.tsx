
// src/components/settings/select-badges-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Loader2, Crown, Bot, Wrench } from "lucide-react";
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

const allPossibleBadges: BadgeType[] = ['creator', 'vip', 'verified', 'dev', 'bot'];

const badgeComponentMap: Record<BadgeType, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
};

const badgeLabelMap: Record<BadgeType, string> = {
  creator: "Creator Badge",
  vip: "VIP Badge",
  verified: "Verified Badge",
  dev: "Developer Badge",
  bot: "Bot Badge"
};


export function SelectBadgesDialog({ isOpen, onOpenChange, userProfile, onSave }: SelectBadgesDialogProps) {
  const [selectedBadges, setSelectedBadges] = useState<BadgeType[]>([]);
  
  const earnedBadges = new Set<BadgeType>();
  if (userProfile.isCreator) earnedBadges.add('creator');
  if (userProfile.isVIP) earnedBadges.add('vip');
  if (userProfile.isVerified) earnedBadges.add('verified');
  if (userProfile.isDevTeam) earnedBadges.add('dev');
  if (userProfile.isBot) earnedBadges.add('bot');
  
  useEffect(() => {
    if (isOpen) {
      // Initialize with the user's current preference, but only include earned badges
      const currentOrder = userProfile.badgeOrder || [];
      setSelectedBadges(currentOrder.filter(b => earnedBadges.has(b)));
    }
  }, [isOpen, userProfile.badgeOrder, userProfile.isCreator, userProfile.isVIP, userProfile.isVerified, userProfile.isDevTeam, userProfile.isBot]);


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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Badges</DialogTitle>
          <DialogDescription>
            Choose which of your earned badges to display. The order you select them in will be their display order on your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {allPossibleBadges.map((badgeKey) => {
            const BadgeIcon = badgeComponentMap[badgeKey];
            const hasBadge = earnedBadges.has(badgeKey);
            const isSelected = selectedBadges.includes(badgeKey);
            const selectionNumber = isSelected ? selectedBadges.indexOf(badgeKey) + 1 : null;
            
            return (
                <div key={badgeKey} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-all",
                    hasBadge ? "cursor-pointer hover:bg-accent" : "opacity-50 cursor-not-allowed bg-muted/50",
                    isSelected && "bg-accent/80 border border-primary/50"
                  )}
                  onClick={() => handleBadgeClick(badgeKey)}
                >
                    <BadgeIcon className={cn("h-5 w-5", badgeKey === 'vip' && 'text-yellow-500', badgeKey === 'dev' && 'text-blue-600', badgeKey === 'bot' && 'text-sky-500')} />
                    <span className="flex-1 font-medium text-sm">{badgeLabelMap[badgeKey]}</span>
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      )}
                    >
                      {selectionNumber || ''}
                    </div>
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
