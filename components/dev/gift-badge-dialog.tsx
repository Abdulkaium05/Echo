
// src/components/dev/gift-badge-dialog.tsx
'use client';

import { useState } from 'react';
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
import { Loader2, Gift, Crown, Bot, Wrench, SmilePlus, FlaskConical, Clock, Search, User as UserIcon, UserCheck, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { findUserByDisplayUid, type UserProfile, giftBadge } from '@/services/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { BadgeType } from '@/app/(app)/layout';
import { CreatorLetterCBBadgeIcon } from '../chat/bot-icons';
import { VerifiedBadge } from '../verified-badge';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface GiftBadgeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const badgeComponentMap: Record<Exclude<BadgeType, 'pioneer' | 'patron' | 'feature_suggestion_approved'>, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  dev: (props) => <Wrench {...props} />,
  bot: (props) => <Bot {...props} />,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
};

const giftableBadges: { value: BadgeType, label: string }[] = [
    { value: 'creator', label: 'Creator Badge' },
    { value: 'vip', label: 'VIP Badge' },
    { value: 'verified', label: 'Verified Badge' },
    { value: 'meme_creator', label: 'Meme Creator Badge' },
    { value: 'beta_tester', label: 'Beta Tester Badge' },
];

export function GiftBadgeDialog({ isOpen, onOpenChange }: GiftBadgeDialogProps) {
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [recipientUid, setRecipientUid] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isFindingUser, setIsFindingUser] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [giftDuration, setGiftDuration] = useState<'lifetime' | '7' | '30'>('lifetime');
  const [isGifting, setIsGifting] = useState(false);
  
  const handleFindUser = async () => {
    const uidToFind = String(recipientUid).trim();
    if (!uidToFind) return;
    setIsFindingUser(true);
    setSelectedUser(null);
    try {
        const user = await findUserByDisplayUid(uidToFind);
        if (user) {
            setSelectedUser(user);
            toast({ title: 'User Found', description: `Selected ${user.name}`});
        } else {
            toast({ title: 'User Not Found', variant: 'destructive'});
        }
    } catch (e) {
        toast({ title: 'Error Finding User', variant: 'destructive'});
    } finally {
        setIsFindingUser(false);
    }
  };

  const handleGiftBadge = async () => {
    if (!currentUserProfile || !selectedUser || !selectedBadge) {
      toast({ title: "Missing Information", description: "Please select a user, a badge, and a duration.", variant: "destructive" });
      return;
    }
    
    setIsGifting(true);

    try {
        const durationInDays = giftDuration === 'lifetime' ? null : parseInt(giftDuration, 10);
        await giftBadge(currentUserProfile.uid, selectedUser.uid, selectedBadge, durationInDays);

        toast({
            title: 'Badge Gifted!',
            description: `You have gifted the ${giftableBadges.find(b => b.value === selectedBadge)?.label || 'new'} badge to ${selectedUser.name} (${giftDuration} days).`,
            duration: 6000,
        });

        onOpenChange(false);
        setRecipientUid('');
        setSelectedUser(null);
        setSelectedBadge(null);

    } catch (error: any) {
      console.error("Error gifting badge:", error);
      toast({
        title: "Error Gifting Badge",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGifting(false);
    }
  };

  const isSubmitDisabled = isGifting || isFindingUser || !selectedUser || !selectedBadge;

  const renderBadgeSelectItem = (badge: { value: BadgeType, label: string }) => {
    const BadgeIcon = badgeComponentMap[badge.value as Exclude<BadgeType, 'pioneer' | 'patron' | 'feature_suggestion_approved'>];
    return (
        <div className="flex items-center gap-2">
            <BadgeIcon className={cn("h-4 w-4", 
                badge.value === 'vip' && 'text-yellow-500', 
                badge.value === 'meme_creator' && 'text-green-500', 
                badge.value === 'beta_tester' && 'text-orange-500'
            )} />
            <span>{badge.label}</span>
        </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Gift a Badge
          </DialogTitle>
          <DialogDescription>
            Select a user, a badge, and duration to grant special status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="recipient-uid-gift">Select User</Label>
                <div className="flex gap-2">
                    <Input 
                        id="recipient-uid-gift"
                        type="text"
                        placeholder="Enter user ID..."
                        value={recipientUid}
                        onChange={e => setRecipientUid(e.target.value)}
                        disabled={isFindingUser}
                    />
                    <Button onClick={handleFindUser} disabled={isFindingUser || !recipientUid.trim()} size="icon">
                        {isFindingUser ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            
            {selectedUser && (
                <div className="p-3 bg-secondary rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
                            <AvatarFallback>{selectedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{selectedUser.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedUser.displayUid}</p>
                        </div>
                    </div>
                    <UserCheck className="h-5 w-5 text-green-500" />
                </div>
            )}

            <div className="space-y-2">
                <Label>Select Badge</Label>
                <Select onValueChange={(value) => setSelectedBadge(value as BadgeType)} value={selectedBadge || ''} disabled={isGifting}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a badge to gift..." />
                    </SelectTrigger>
                    <SelectContent>
                        {giftableBadges.map(badge => (
                            <SelectItem key={badge.value} value={badge.value}>
                                {renderBadgeSelectItem(badge)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <Separator />
            
             <div className="space-y-2">
                <Label>Gift Duration</Label>
                 <RadioGroup defaultValue="lifetime" value={giftDuration} onValueChange={(value) => setGiftDuration(value as 'lifetime' | '7' | '30')} className="flex gap-4 pt-1" disabled={isGifting}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lifetime" id="lifetime-gift" />
                        <Label htmlFor="lifetime-gift" className="flex items-center gap-1.5 cursor-pointer">
                            <Gift className="h-4 w-4"/> Lifetime
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="7" id="trial-7-gift" />
                        <Label htmlFor="trial-7-gift" className="flex items-center gap-1.5 cursor-pointer">
                            <Clock className="h-4 w-4" /> 7 Days
                        </Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30" id="trial-30-gift" />
                        <Label htmlFor="trial-30-gift" className="flex items-center gap-1.5 cursor-pointer">
                            <Clock className="h-4 w-4" /> 30 Days
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isGifting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleGiftBadge} disabled={isSubmitDisabled}>
            {isGifting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
            {isGifting ? 'Gifting...' : 'Gift Badge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
