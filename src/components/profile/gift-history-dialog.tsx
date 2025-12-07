
// src/components/profile/gift-history-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, Inbox, Loader2, Gift, Crown, Coins, SmilePlus, FlaskConical, Bot, Wrench, Lightbulb, Mail } from "lucide-react";
import { useAuth, type UserProfile, type GiftInfo, type PointsGiftInfo } from '@/context/auth-context';
import { getGiftHistory, type Gift, getUserProfile } from '@/services/firestore';
import { cn } from '@/lib/utils';
import type { BadgeType } from '@/app/(app)/layout';
import { CreatorLetterCBBadgeIcon } from '../chat/bot-icons';
import { VerifiedBadge } from '../verified-badge';
import { SuggestionApprovedDialog } from './suggestion-approved-dialog';

interface GiftHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const badgeComponentMap: Record<string, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
  feature_suggestion_approved: (props) => <Mail {...props} />,
};

const badgeLabelMap: Record<string, string> = {
  creator: "Creator",
  vip: "VIP",
  verified: "Verified",
  dev: "Developer",
  bot: "Bot",
  meme_creator: "Meme Creator",
  beta_tester: "Beta Tester",
  feature_suggestion_approved: "Feature Suggestion Approved",
};

interface EnrichedGift extends Gift {
    senderProfile: UserProfile | null;
}

export function GiftHistoryDialog({ isOpen, onOpenChange }: GiftHistoryDialogProps) {
  const { user, setGiftInfo, setPointsGiftInfo } = useAuth();
  const [gifts, setGifts] = useState<EnrichedGift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [selectedGifter, setSelectedGifter] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      const unsubscribe = getGiftHistory(user.uid, async (fetchedGifts) => {
        const enrichedGifts = await Promise.all(fetchedGifts.map(async (gift) => {
            const senderProfile = await getUserProfile(gift.senderId);
            return { ...gift, senderProfile };
        }));
        setGifts(enrichedGifts);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching gift history:", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isOpen, user]);

  const handleGiftClick = (gift: EnrichedGift) => {
    if (!gift.senderProfile) return;

    if (gift.giftType === 'badge' && gift.badgeType) {
        setGiftInfo({ gifterProfile: gift.senderProfile, giftedBadge: gift.badgeType as BadgeType });
    } else if (gift.giftType === 'points' && gift.pointsAmount) {
        setPointsGiftInfo({ gifterProfile: gift.senderProfile, giftedPointsAmount: gift.pointsAmount });
    } else if (gift.giftType === 'feature_suggestion_approved') {
        setSelectedGifter(gift.senderProfile);
        setShowSuggestionDialog(true);
    }
  };
  
  const formatDate = (timestamp: any) => {
      if (!timestamp || !timestamp.toDate) return 'A while ago';
      return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Gift History
            </DialogTitle>
            <DialogDescription>
              A log of all the wonderful gifts and rewards you've received.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full -mx-6">
              <div className="px-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Loading gift history...</p>
                  </div>
                ) : gifts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                    <Inbox className="h-12 w-12 mb-3" />
                    <p className="font-medium">No gifts yet</p>
                    <p className="text-sm">Received gifts will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gifts.map((gift) => {
                      const GiftIcon = badgeComponentMap[gift.giftType === 'badge' && gift.badgeType ? gift.badgeType : gift.giftType] || Gift;
                      const fallback = gift.senderProfile?.name.substring(0, 2).toUpperCase() || '??';
                      
                      let message;
                      if (gift.giftType === 'feature_suggestion_approved') {
                          message = <><span className="font-semibold">Your feature suggestion was approved!</span> You received the <span className="font-semibold text-primary">{badgeLabelMap[gift.badgeType!]} badge</span> and <span className="font-semibold text-primary">{gift.pointsAmount} points</span>.</>;
                      } else {
                          message = <>
                            <span className="font-semibold">{gift.senderProfile?.name || 'Someone'}</span> sent you{' '}
                            {gift.giftType === 'badge' ? (
                              <span className="font-semibold text-primary">{badgeLabelMap[gift.badgeType!]} badge</span>
                            ) : (
                              <span className="font-semibold text-primary">{gift.pointsAmount} points</span>
                            )}.
                          </>;
                      }

                      return (
                        <div
                          key={gift.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/50 hover:bg-accent/50 cursor-pointer"
                          onClick={() => handleGiftClick(gift)}
                        >
                          <div className="relative">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={gift.senderProfile?.avatarUrl} alt={gift.senderProfile?.name} />
                                  <AvatarFallback>{fallback}</AvatarFallback>
                              </Avatar>
                               <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow">
                                  <GiftIcon className={cn("h-4 w-4", 
                                      gift.giftType === 'points' && "text-yellow-500",
                                      gift.giftType === 'badge' && 'text-pink-500',
                                      gift.giftType === 'feature_suggestion_approved' && "text-primary"
                                  )} />
                               </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{message}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(gift.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedGifter && (
        <SuggestionApprovedDialog 
            isOpen={showSuggestionDialog}
            onOpenChange={setShowSuggestionDialog}
            devProfile={selectedGifter}
        />
      )}
    </>
  );
}
