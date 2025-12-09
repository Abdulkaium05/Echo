// src/app/(app)/badge-upgrade/page.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle, Star, Lock, Bot } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { UserProfile } from '@/types/user';
import type { BadgeType } from '@/app/(app)/layout';
import {
  CreatorLetterCBBadgeIcon, VipLv2BadgeIcon, MemeCreatorLv2BadgeIcon, BetaTesterLv2BadgeIcon,
  CreatorLv2BadgeIcon, PioneerBadgeIcon, PatronBadgeIcon, BotLv2BadgeIcon,
  VipLv3BadgeIcon, CreatorLv3BadgeIcon, MemeCreatorLv3BadgeIcon, BetaTesterLv3BadgeIcon,
  PioneerLv3BadgeIcon, PatronLv3BadgeIcon, BotLv3BadgeIcon, PioneerLv2BadgeIcon, PatronLv2BadgeIcon
} from '@/components/chat/bot-icons';
import { VerifiedBadge } from '@/components/verified-badge';
import { Crown, SmilePlus, FlaskConical, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const badgeUpgradeConfig: Record<string, { cost: number, LvlIcon: React.FC<any>, NextLvlIcon: React.FC<any>, check: (p: UserProfile) => boolean, target: keyof UserProfile, colorClass?: string, label: string, nextLevel: number }> = {
  // Lvl 2
  'Creator': { cost: 5, LvlIcon: CreatorLetterCBBadgeIcon, NextLvlIcon: CreatorLv2BadgeIcon, check: p => !!p.isCreator && !p.isCreatorLv2, target: 'isCreatorLv2', colorClass: 'text-purple-500', label: "Creator to Lvl 2", nextLevel: 2 },
  'Verified': { cost: 10, LvlIcon: VerifiedBadge, NextLvlIcon: PatronBadgeIcon, check: p => !!p.isVerified && !p.isPatron, target: 'isPatron', colorClass: 'text-sky-500', label: "Verified to Patron", nextLevel: 2 },
  'Developer': { cost: 10, LvlIcon: Wrench, NextLvlIcon: PioneerBadgeIcon, check: p => !!p.isDevTeam && !p.isPioneer, target: 'isPioneer', colorClass: 'text-purple-500', label: "Developer to Pioneer", nextLevel: 2 },
  'Meme Creator': { cost: 3, LvlIcon: SmilePlus, NextLvlIcon: MemeCreatorLv2BadgeIcon, check: p => !!p.isMemeCreator && !p.isMemeCreatorLv2, target: 'isMemeCreatorLv2', colorClass: 'text-green-500', label: "Meme Creator to Lvl 2", nextLevel: 2 },
  'Beta Tester': { cost: 3, LvlIcon: FlaskConical, NextLvlIcon: BetaTesterLv2BadgeIcon, check: p => !!p.isBetaTester && !p.isBetaTesterLv2, target: 'isBetaTesterLv2', colorClass: 'text-orange-500', label: "Beta Tester to Lvl 2", nextLevel: 2 },
};

export default function BadgeUpgradePage() {
    const { userProfile, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
    const [dialogState, setDialogState] = useState<{ isOpen: boolean, onConfirm: (() => void) | null, badgeName: string, cost: number }>({ isOpen: false, onConfirm: null, badgeName: '', cost: 0 });

    const handleUpgrade = (badgeName: string, cost: number, targetField: keyof UserProfile) => {
        setDialogState({
            isOpen: true,
            badgeName,
            cost,
            onConfirm: async () => {
                if (!userProfile) return;
                const currentGems = userProfile.starGems || 0;
                if (currentGems < cost) {
                    toast({ title: 'Insufficient Star Gems', description: `You need ${cost} gems to upgrade this badge.`, variant: 'destructive' });
                    setDialogState({ isOpen: false, onConfirm: null, badgeName: '', cost: 0 });
                    return;
                }

                setIsUpgrading(badgeName);
                try {
                    await updateUserProfile({
                        starGems: currentGems - cost,
                        [targetField]: true
                    });
                    toast({
                        title: 'Upgrade Successful!',
                        description: `Your ${badgeName} badge has been upgraded!`,
                        action: <CheckCircle className="h-5 w-5 text-green-500" />
                    });
                } catch (error: any) {
                    toast({ title: "Upgrade Failed", description: error.message, variant: "destructive" });
                } finally {
                    setIsUpgrading(null);
                    setDialogState({ isOpen: false, onConfirm: null, badgeName: '', cost: 0 });
                }
            }
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full">
            <div className="space-y-8">
                <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Star className="text-yellow-400" />
                            Your Star Gems
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{userProfile?.starGems || 0}</p>
                    </CardContent>
                </Card>

                <h2 className="text-xl font-semibold text-center">Badge Upgrade Center</h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(badgeUpgradeConfig).map(([name, config]) => {
                        const { cost, LvlIcon, NextLvlIcon, target, colorClass, label, nextLevel, check } = config;
                        const isThisUpgrading = isUpgrading === name;
                        const isEligible = userProfile ? check(userProfile) : false;

                        return (
                            <Card key={name} className={cn(!isEligible && "grayscale opacity-60")}>
                                <CardHeader>
                                    <CardTitle>{label}</CardTitle>
                                    <CardDescription>Upgrade your badge to the animated Level {nextLevel} version.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-around">
                                    <div className="flex flex-col items-center gap-2">
                                        <LvlIcon className={cn("h-10 w-10", colorClass)} />
                                        <p className="text-sm font-medium">Level {nextLevel-1}</p>
                                    </div>
                                    <ArrowRight className="h-8 w-8 text-primary" />
                                    <div className="flex flex-col items-center gap-2">
                                        <NextLvlIcon className="h-12 w-12" />
                                        <p className="text-sm font-medium">Level {nextLevel}</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        onClick={() => handleUpgrade(name, cost, target)}
                                        disabled={isUpgrading !== null || !isEligible}
                                        className="w-full"
                                    >
                                        {isThisUpgrading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : !isEligible ? (
                                            <Lock className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Star className="mr-2 h-4 w-4" />
                                        )}
                                        {isThisUpgrading ? 'Upgrading...' : !isEligible ? 'Locked' : `Upgrade for ${cost} Gems`}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ ...dialogState, isOpen: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Badge Upgrade</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to spend {dialogState.cost} Star Gems to upgrade your {dialogState.badgeName} badge? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDialogState({ isOpen: false, onConfirm: null, badgeName: '', cost: 0 })}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => dialogState.onConfirm?.()}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
