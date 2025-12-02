
// src/components/dev/gift-badge-dialog.tsx
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
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Gift, Crown, Bot, Wrench, SmilePlus, FlaskConical, Clock, UserSearch } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getNormalUsers, type UserProfile, findUserByDisplayId } from '@/services/firestore';
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

const badgeComponentMap: Record<BadgeType, React.FC<{className?: string}>> = {
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
  const { user: currentUser, userProfile: currentUserProfile, updateMockUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [recipientId, setRecipientId] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [giftDuration, setGiftDuration] = useState<'trial' | 'lifetime'>('lifetime');
  const [isFindingUser, setIsFindingUser] = useState(false);
  const [isGifting, setIsGifting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setRecipientId('');
      setFoundUser(null);
      setSelectedBadge(null);
      setGiftDuration('lifetime');
    }
  }, [isOpen]);

  const handleFindUser = async () => {
    if (!recipientId.trim()) {
        toast({ title: "User ID Required", description: "Please enter a User ID.", variant: "destructive" });
        return;
    }
    setIsFindingUser(true);
    setFoundUser(null);
    try {
        const user = await findUserByDisplayId(String(recipientId).trim());
        if (user && user.uid !== currentUser?.uid) {
            setFoundUser(user);
        } else if (user && user.uid === currentUser?.uid) {
            toast({ title: "Invalid Recipient", description: "You cannot gift a badge to yourself.", variant: "destructive" });
        } else {
            toast({ title: "User Not Found", description: `No user with ID "${recipientId}" found.`, variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsFindingUser(false);
    }
  };

  const handleGiftBadge = async () => {
    if (!currentUserProfile || !foundUser || !selectedBadge) {
      toast({ title: "Missing Information", description: "Please select a user, a badge, and a duration.", variant: "destructive" });
      return;
    }
    
    setIsGifting(true);

    try {
        const badgeKey = `is${selectedBadge.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof UserProfile;
        
        let expiryTimestamp: number | undefined = undefined;
        if (giftDuration === 'trial') {
            expiryTimestamp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
        }
        
        const recipientProfile = await findUserByDisplayId(String(recipientId).trim());
        if (!recipientProfile) {
            throw new Error("Could not find the recipient's profile to update.");
        }

        // Update user profile with the new badge and potentially an expiry date
        await updateMockUserProfile(foundUser.uid, { 
            [badgeKey]: true,
            badgeExpiry: {
                ...recipientProfile.badgeExpiry,
                [selectedBadge]: expiryTimestamp, // Undefined for lifetime
            },
            // Transient properties for login notification
            giftedByUid: currentUserProfile.uid,
            hasNewGift: true,
            lastGiftedBadge: selectedBadge,
        });

        toast({
            title: 'Badge Gifted!',
            description: `You have gifted the ${giftableBadges.find(b => b.value === selectedBadge)?.label || 'new'} badge to ${foundUser.name} (${giftDuration}).`,
            duration: 6000,
        });

        onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Error Gifting Badge",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGifting(false);
    }
  };

  const isSubmitDisabled = isGifting || isFindingUser || !foundUser || !selectedBadge;

  const renderBadgeSelectItem = (badge: { value: BadgeType, label: string }) => {
    const BadgeIcon = badgeComponentMap[badge.value];
    return (
        <div className="flex items-center gap-2">
            <BadgeIcon className={cn("h-4 w-4", badge.value === 'vip' && 'text-yellow-500', badge.value === 'meme_creator' && 'text-green-500', badge.value === 'beta_tester' && 'text-orange-500')} />
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
                <Label>Recipient's User ID</Label>
                <div className="flex gap-2">
                     <Input 
                        value={recipientId}
                        onChange={(e) => {
                            setRecipientId(e.target.value);
                            if (foundUser) setFoundUser(null);
                        }}
                        placeholder="e.g., test.user.01"
                        disabled={isFindingUser || isGifting}
                    />
                    <Button onClick={handleFindUser} disabled={isFindingUser || isGifting || !recipientId.trim()}>
                        {isFindingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            {foundUser && (
                <div className="p-3 rounded-md border bg-accent/50 flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={foundUser.avatarUrl} alt={foundUser.name} />
                        <AvatarFallback>{foundUser.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{foundUser.name}</span>
                        <span className="text-xs text-muted-foreground">Recipient Verified</span>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label>Select Badge</Label>
                <Select onValueChange={(value) => setSelectedBadge(value as BadgeType)} value={selectedBadge || ''} disabled={isGifting || !foundUser}>
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
                 <RadioGroup defaultValue="lifetime" value={giftDuration} onValueChange={(value) => setGiftDuration(value as 'trial' | 'lifetime')} className="flex gap-4 pt-1" disabled={isGifting}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lifetime" id="lifetime" />
                        <Label htmlFor="lifetime" className="flex items-center gap-1.5 cursor-pointer">
                            <Gift className="h-4 w-4"/> Lifetime
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="trial" id="trial" />
                        <Label htmlFor="trial" className="flex items-center gap-1.5 cursor-pointer">
                            <Clock className="h-4 w-4" /> Trial (7 Days)
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
