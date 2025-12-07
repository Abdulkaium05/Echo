// src/components/dev/tools/badge-qr-generator.tsx
'use client';

import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, QrCode, Crown, SmilePlus, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createBadgeGiftCode, getBadgeGiftCodes, type BadgeGiftCode } from '@/services/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BadgeType } from '@/app/(app)/layout';
import { cn } from '@/lib/utils';
import { CreatorLetterCBBadgeIcon } from '@/components/chat/bot-icons';
import { VerifiedBadge } from '@/components/verified-badge';

const giftableBadges: { value: BadgeType, label: string }[] = [
    { value: 'creator', label: 'Creator Badge' },
    { value: 'vip', label: 'VIP Badge' },
    { value: 'verified', label: 'Verified Badge' },
    { value: 'meme_creator', label: 'Meme Creator Badge' },
    { value: 'beta_tester', label: 'Beta Tester Badge' },
];

const badgeComponentMap: Record<Exclude<BadgeType, 'pioneer' | 'patron' | 'dev' | 'bot' | 'feature_suggestion_approved'>, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
};

export function BadgeQrGeneratorTab() {
  const { toast } = useToast();

  const [badgeGiftType, setBadgeGiftType] = useState<BadgeType | null>(null);
  const [badgeGiftDuration, setBadgeGiftDuration] = useState(7);
  const [badgeTotalUses, setBadgeTotalUses] = useState(100);
  const [badgeUsesPerUser, setBadgeUsesPerUser] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<BadgeGiftCode | null>(null);
  
  const [canGenerate, setCanGenerate] = useState(true);
  const [cooldown, setCooldown] = useState('');
  const [lastCodeTimestamp, setLastCodeTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    getBadgeGiftCodes().then(codes => {
      if (codes.length > 0) {
        const lastCode = codes[codes.length - 1];
        setLastCodeTimestamp(lastCode.createdAt);
      }
    });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lastCodeTimestamp) {
        const oneHour = 60 * 60 * 1000;
        const updateCooldown = () => {
            const timeLeft = (lastCodeTimestamp + oneHour) - Date.now();
            if (timeLeft <= 0) {
                setCanGenerate(true);
                setCooldown('');
                if(timer) clearInterval(timer);
            } else {
                setCanGenerate(false);
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCooldown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };
        updateCooldown();
        timer = setInterval(updateCooldown, 1000);
    }
    return () => clearInterval(timer);
  }, [lastCodeTimestamp]);

  const handleGenerate = async () => {
      if (!badgeGiftType) {
          toast({ title: "Error", description: "Please select a badge type.", variant: "destructive" });
          return;
      }
      setIsGenerating(true);
      setGeneratedCode(null);
      try {
          const code = await createBadgeGiftCode(badgeGiftType, badgeGiftDuration, badgeTotalUses, badgeUsesPerUser);
          setGeneratedCode(code);
          setLastCodeTimestamp(code.createdAt); // Update last generated timestamp
          toast({ title: "Badge Gift QR Code Generated!" });
      } catch (error: any) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
          setIsGenerating(false);
      }
  };
  
  const renderBadgeSelectItem = (badge: { value: BadgeType, label: string }) => {
    const BadgeIcon = badgeComponentMap[badge.value as Exclude<BadgeType, 'pioneer' | 'patron' | 'dev' | 'bot' | 'feature_suggestion_approved'>];
    return (
        <div className="flex items-center gap-2">
            <BadgeIcon className={cn("h-4 w-4", badge.value === 'vip' && 'text-yellow-500', badge.value === 'meme_creator' && 'text-green-500', badge.value === 'beta_tester' && 'text-orange-500')} />
            <span>{badge.label}</span>
        </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
                <QrCode className="h-7 w-7 text-primary" />
                Badge Gift QR Generator
            </CardTitle>
            <CardDescription>
                Create a QR code that gifts a timed badge. You can generate one QR code per hour.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label>Badge Type</Label>
                <Select onValueChange={(value) => setBadgeGiftType(value as BadgeType)} value={badgeGiftType || ''} disabled={isGenerating}>
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
            <div className="space-y-2">
                <Label htmlFor="badge-duration">Badge Duration (Days)</Label>
                <Input id="badge-duration" type="number" value={badgeGiftDuration} onChange={(e) => setBadgeGiftDuration(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="badge-total-uses">Total Uses</Label>
                <Input id="badge-total-uses" type="number" value={badgeTotalUses} onChange={(e) => setBadgeTotalUses(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="badge-uses-per-user">Uses Per User</Label>
                <Input id="badge-uses-per-user" type="number" value={badgeUsesPerUser} onChange={(e) => setBadgeUsesPerUser(parseInt(e.target.value) || 1)} />
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
             <Button onClick={handleGenerate} disabled={isGenerating || !badgeGiftType || !canGenerate}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate Badge QR"}
            </Button>
            {!canGenerate && (
                 <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Please wait {cooldown} to generate another QR code.</span>
                </div>
            )}
            {generatedCode && (
                <div className="w-full p-4 bg-white rounded-lg flex items-center justify-center">
                    <QRCode
                        value={JSON.stringify(generatedCode)}
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "180px" }}
                        viewBox={`0 0 256 256`}
                    />
                </div>
            )}
        </CardFooter>
    </Card>
  );
}
