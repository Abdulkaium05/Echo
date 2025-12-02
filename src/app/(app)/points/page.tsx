
// src/app/(app)/points/page.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift, Coins, UserSearch, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { giftPoints, findUserByDisplayId, type UserProfile } from '@/services/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function GiftPointsCard() {
    const { userProfile, updateMockUserProfile } = useAuth();
    const { toast } = useToast();
    
    const [recipientId, setRecipientId] = useState('');
    const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
    const [amount, setAmount] = useState(1);
    const [isFindingUser, setIsFindingUser] = useState(false);
    const [isGifting, setIsGifting] = useState(false);
    
    const handleFindUser = async () => {
        if (!recipientId.trim()) {
            toast({ title: "User ID Required", description: "Please enter a User ID to find a recipient.", variant: "destructive" });
            return;
        }
        setIsFindingUser(true);
        setFoundUser(null);
        try {
            const user = await findUserByDisplayId(recipientId);
            if (user && user.uid !== userProfile?.uid) {
                setFoundUser(user);
                toast({ title: "User Found", description: `You are about to gift points to ${user.name}.`, action: <CheckCircle className="text-green-500" /> });
            } else if (user && user.uid === userProfile?.uid) {
                toast({ title: "Cannot Gift Yourself", description: "You cannot send points to your own account.", variant: "destructive" });
            } else {
                toast({ title: "User Not Found", description: `No user found with the ID "${recipientId}".`, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsFindingUser(false);
        }
    };

    const handleGiftPoints = async () => {
        if (!userProfile || !foundUser || !amount || amount <= 0) {
            toast({ title: "Invalid Input", description: "Please find a user and enter a valid amount.", variant: "destructive" });
            return;
        }
        if ((userProfile.points || 0) < amount) {
            toast({ title: "Insufficient Points", description: `You only have ${userProfile.points || 0} points.`, variant: "destructive" });
            return;
        }
        
        setIsGifting(true);
        
        try {
            await giftPoints(userProfile.uid, foundUser.uid, amount);

            updateMockUserProfile(userProfile.uid, { points: (userProfile.points || 0) - amount });
            
            toast({
                title: 'Points Gifted!',
                description: `You have successfully gifted ${amount} points to ${foundUser.name}.`,
            });

            setFoundUser(null);
            setRecipientId('');
            setAmount(1);

        } catch (error: any) {
            toast({ title: "Gifting Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsGifting(false);
        }
    };
    
    const isGiftButtonDisabled = isGifting || isFindingUser || !foundUser || amount <= 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Gift className="h-6 w-6 text-primary" />
                    Gift Points
                </CardTitle>
                <CardDescription>
                    Send some of your points to another user by their User ID.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="recipient-id">Recipient's User ID</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="recipient-id"
                            value={recipientId}
                            onChange={(e) => {
                                setRecipientId(e.target.value);
                                if (foundUser) setFoundUser(null); // Reset if ID changes
                            }}
                            placeholder="e.g., abdul.kaium.05"
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
                    <Label htmlFor="points-amount">Amount to Gift</Label>
                    <Input 
                        id="points-amount" 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} 
                        min="1"
                        max={userProfile?.points}
                        disabled={!foundUser || isGifting}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleGiftPoints} disabled={isGiftButtonDisabled} className="w-full">
                    {isGifting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                    {isGifting ? 'Gifting...' : `Gift ${amount} Points`}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PointsDashboardPage() {
    const { userProfile } = useAuth();
    
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full">
            <div className="space-y-8">
                <Card className={cn("overflow-hidden", "gradient-background")}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg text-foreground">
                            <Coins className="h-6 w-6" />
                            Your Points Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pb-8">
                        <p className="text-6xl font-bold tracking-tight text-foreground">
                            {userProfile?.points || 0}
                        </p>
                    </CardContent>
                </Card>

                <GiftPointsCard />
            </div>
        </div>
    );
}
