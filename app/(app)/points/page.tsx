// src/app/points/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift, Coins, User as UserIcon, Search, AlertCircle, UserCheck } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { type UserProfile, giftPoints, findUserByDisplayUid, logGift } from '@/services/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function GiftPointsCard() {
    const { user: currentUser, userProfile, updateUserProfile } = useAuth();
    const { toast } = useToast();
    
    const [recipientUid, setRecipientUid] = useState('');
    const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
    const [isFindingUser, setIsFindingUser] = useState(false);
    const [amount, setAmount] = useState(1);
    const [isGifting, setIsGifting] = useState(false);
    
    const handleFindUser = async () => {
        const uidToFind = String(recipientUid).trim();
        if (!uidToFind) {
            toast({ title: 'User ID required', description: 'Please enter a user ID.', variant: 'destructive' });
            return;
        }
        if (uidToFind === userProfile?.displayUid) {
             toast({ title: 'Cannot Gift Self', description: 'You cannot gift points to yourself.', variant: 'destructive' });
            return;
        }

        setIsFindingUser(true);
        setFoundUser(null);
        try {
            const user = await findUserByDisplayUid(uidToFind);
            if (user) {
                setFoundUser(user);
                 toast({ title: 'User Found', description: `Found user: ${user.name}` });
            } else {
                toast({ title: 'User Not Found', description: 'No user found with that ID.', variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error Finding User', description: error.message, variant: 'destructive' });
        } finally {
            setIsFindingUser(false);
        }
    };
    
    const handleGiftPoints = async () => {
        if (!userProfile || !foundUser || amount <= 0) {
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

            await logGift({
                senderId: userProfile.uid,
                receiverId: foundUser.uid,
                giftType: 'points',
                pointsAmount: amount,
            });

            updateUserProfile({ points: (userProfile.points || 0) - amount });
            
            toast({
                title: 'Points Gifted!',
                description: `You have successfully gifted ${amount} points to ${foundUser.name}.`,
            });
            
            setFoundUser(null);
            setRecipientUid('');
            setAmount(1);

        } catch (error: any) {
            toast({ title: "Gifting Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsGifting(false);
        }
    };
    
    const isSubmitDisabled = isGifting || !foundUser || amount <= 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Gift className="h-6 w-6 text-primary" />
                    Gift Points
                </CardTitle>
                <CardDescription>
                    Send some of your points to another user via their User ID.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="recipient-uid">Recipient User ID</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="recipient-uid" 
                            type="text" 
                            placeholder="e.g, john.doe.123 or 12345678"
                            value={recipientUid}
                            onChange={(e) => setRecipientUid(e.target.value)}
                            disabled={isFindingUser}
                        />
                        <Button onClick={handleFindUser} disabled={isFindingUser || !recipientUid.trim()}>
                            {isFindingUser ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                            <span className="sr-only">Find User</span>
                        </Button>
                    </div>
                </div>

                {foundUser && (
                    <div className="p-3 bg-secondary rounded-lg border flex items-center justify-between">
                       <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={foundUser.avatarUrl} alt={foundUser.name} />
                                <AvatarFallback>{foundUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{foundUser.name}</p>
                                <p className="text-xs text-muted-foreground">{foundUser.displayUid}</p>
                            </div>
                       </div>
                        <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="points-amount">Amount to Gift</Label>
                    <Input 
                        id="points-amount" 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? 1 : parseInt(e.target.value) || 1)}
                        min="1"
                        max={userProfile?.points}
                        disabled={!foundUser}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleGiftPoints} disabled={isSubmitDisabled} className="w-full">
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
                <Card className="bg-gradient-to-r from-primary/10 to-accent/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Coins className="h-6 w-6 text-yellow-500" />
                            Your Points Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{userProfile?.points || 0}</p>
                    </CardContent>
                </Card>

                <GiftPointsCard />
            </div>
        </div>
    );
}
