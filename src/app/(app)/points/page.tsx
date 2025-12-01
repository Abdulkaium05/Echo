
// src/app/(app)/points/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift, Coins, ChevronRight } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getAllGiftableUsers, type UserProfile, giftPoints } from '@/services/firestore';
import { UserMultiSelect } from '@/components/poll/multi-select-users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function GiftPointsCard() {
    const { userProfile, updateMockUserProfile } = useAuth();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [amount, setAmount] = useState(1);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isGifting, setIsGifting] = useState(false);
    
    useEffect(() => {
        if (!userProfile) return;
        setIsLoadingUsers(true);
        getAllGiftableUsers()
            .then(users => {
                setAllUsers(users.filter(u => u.uid !== userProfile?.uid));
            })
            .catch(err => {
                toast({ title: 'Error', description: 'Could not load users.', variant: 'destructive' });
            })
            .finally(() => setIsLoadingUsers(false));
    }, [userProfile, toast]);
    
    const handleGiftPoints = async () => {
        if (!userProfile || !selectedUser || amount <= 0) {
            toast({ title: "Invalid Input", description: "Please select a user and enter a valid amount.", variant: "destructive" });
            return;
        }
        if ((userProfile.points || 0) < amount) {
            toast({ title: "Insufficient Points", description: `You only have ${userProfile.points || 0} points.`, variant: "destructive" });
            return;
        }
        
        setIsGifting(true);
        
        try {
            await giftPoints(userProfile.uid, selectedUser.uid, amount);

            updateMockUserProfile(userProfile.uid, { points: (userProfile.points || 0) - amount });
            
            toast({
                title: 'Points Gifted!',
                description: `You have successfully gifted ${amount} points to ${selectedUser.name}.`,
            });

            setSelectedUser(null);
            setAmount(1);

        } catch (error: any) {
            toast({ title: "Gifting Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsGifting(false);
        }
    };
    
    const isSubmitDisabled = isGifting || isLoadingUsers || !selectedUser || amount <= 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Gift className="h-6 w-6 text-primary" />
                    Gift Points
                </CardTitle>
                <CardDescription>
                    Send some of your points to another user.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Recipient</Label>
                    {isLoadingUsers ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span>Loading users...</span>
                        </div>
                    ) : (
                        <UserMultiSelect
                            users={allUsers}
                            selectedUsers={selectedUser ? [selectedUser] : []}
                            onSelectedUsersChange={(users) => setSelectedUser(users[0] || null)}
                            maxSelection={1}
                        />
                    )}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="points-amount">Amount to Gift</Label>
                    <Input 
                        id="points-amount" 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} 
                        min="1"
                        max={userProfile?.points}
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
                <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <Coins className="h-6 w-6" />
                            Your Points Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pb-8">
                        <p className="text-6xl font-bold tracking-tight">
                            {userProfile?.points || 0}
                        </p>
                    </CardContent>
                </Card>

                <GiftPointsCard />
            </div>
        </div>
    );
}
