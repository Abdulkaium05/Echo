
// src/app/(app)/subscribe/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionCard } from '@/components/subscribe/subscription-card';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, PartyPopper, Ban, Loader2, Clock, Ticket, Coins, Info } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useVIP } from '@/context/vip-context';
import { useAuth } from '@/context/auth-context';
import { 
    updateVIPStatus,
    redeemVipPromoCode,
    redeemPointsPromoCode,
} from '@/services/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const subscriptionPlans = [
    { planName: 'Micro VIP', price: 1, points: 100, durationDays: 1, features: ['VIP Badge', 'Select 3 Verified Users', 'Exclusive Chat Access'] },
    { planName: 'Mini Pass', price: 2, points: 200, durationDays: 3, features: ['VIP Badge', 'Select 3 Verified Users', 'Exclusive Chat Access'] },
    { planName: 'Basic Pack', price: 4, points: 400, durationDays: 7, features: ['VIP Badge', 'Select 3 Verified Users', 'Exclusive Chat Access'] },
    { planName: 'Starter', price: 7, points: 700, durationDays: 14, features: ['VIP Badge', 'Select 5 Verified Users', 'Exclusive Chat Access'] },
    { planName: 'Bronze', price: 12, points: 1200, durationDays: 30, features: ['VIP Badge', 'Select 5 Verified Users', 'Exclusive Chat Access', 'Early Feature Access'] },
    { planName: 'Silver', price: 20, points: 2000, durationDays: 60, features: ['VIP Badge', 'Select 5 Verified Users', 'Exclusive Chat Access', 'Early Feature Access', 'Custom Theme'], isPopular: true },
    { planName: 'Gold', price: 30, points: 3000, durationDays: 90, features: ['VIP Badge', 'Select 10 Verified Users', 'Dedicated Support', 'Exclusive Chat Access', 'Custom Theme'] },
    { planName: 'Platinum', price: 50, points: 5000, durationDays: 180, features: ['VIP Badge', 'Select 10 Verified Users', 'Dedicated Support', 'Exclusive Chat Access', 'Custom Theme', 'Increased Limits'] },
    { planName: 'Diamond', price: 60, points: 6000, durationDays: 270, features: ['VIP Badge', 'Select 10 Verified Users', 'Dedicated Support', 'Exclusive Chat Access', 'Custom Theme', 'Increased Limits'] },
    { planName: 'Elite Yearly', price: 75, points: 7500, durationDays: 365, features: ['VIP Badge', 'Select 10 Verified Users', 'Dedicated Support', 'Exclusive Chat Access', 'Custom Theme', 'Increased Limits'] },
];

const lifetimePlan = {
  planName: 'Lifetime VIP',
  price: 50,
  points: 5000,
  durationDays: Infinity,
  features: ['Permanent VIP Badge', 'All current & future VIP features', 'Highest chat limits', 'Priority support'],
  isPopular: false,
};


export default function SubscribePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, userProfile, loading: authLoading, isUserProfileLoading, updateMockUserProfile } = useAuth();
  const { isVIP: hasVipBadge, hasVipAccess, setVIPStatus: setContextVIPStatus } = useVIP();

  const isEligibleForLifetime = userProfile?.isVerified || userProfile?.isCreator;
  const vipExpiryTimestamp = userProfile?.vipExpiryTimestamp;

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState<{name: string, features: string[]} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const paymentMethod: 'money' | 'points' = 'points'; // Hardcoded to points


  const formatRemainingTime = (ms: number): string => {
    if (ms <= 0) return "Expired";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSubscriptionExpired = useCallback(async () => {
    if (!user) return;
    setIsProcessing(true); 
    toast({
      title: "VIP Subscription Expired",
      description: "Your VIP badge and benefits have ended. Renew to continue enjoying them!",
      variant: "destructive",
    });
    try {
      await updateVIPStatus(user.uid, false);
      updateMockUserProfile(user.uid, { isVIP: false, vipPack: undefined, vipExpiryTimestamp: undefined, selectedVerifiedContacts: [], hasMadeVipSelection: false });
      setContextVIPStatus(false, undefined);
      setRemainingTime(null); 
    } catch (error) {
      console.error("Error handling subscription expiry:", error);
      toast({
        title: "Error",
        description: "Could not update your subscription status after expiry.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, updateMockUserProfile, setContextVIPStatus, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (hasVipBadge && vipExpiryTimestamp) {
      const updateTimer = () => {
        const now = Date.now();
        const timeLeft = vipExpiryTimestamp - now;
        if (timeLeft <= 0) {
          setRemainingTime("Expired");
          if (intervalId) clearInterval(intervalId);
          handleSubscriptionExpired(); 
        } else {
          setRemainingTime(formatRemainingTime(timeLeft));
        }
      };
      updateTimer(); 
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setRemainingTime(null);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasVipBadge, vipExpiryTimestamp, handleSubscriptionExpired]);


  const handleSubscribe = async (plan: { planName: string; price: number; points: number; durationDays: number; features: string[] }) => {
    if (!user || !userProfile) {
       toast({ title: "Not Logged In", description: "You must be logged in to subscribe.", variant: "destructive"});
       router.push('/login');
       return;
    }
    setIsProcessing(true);
    setSubscribedPlan({ name: plan.planName, features: plan.features });
    
    const userPoints = userProfile.points || 0;
    if (userPoints < plan.points) {
        toast({
          title: "Insufficient Points",
          description: `You need ${plan.points} points, but you only have ${userPoints}.`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
      const expiry = plan.durationDays === Infinity ? undefined : Date.now() + plan.durationDays * 24 * 60 * 60 * 1000;
      const updatedPoints = userPoints - plan.points;
      
      await updateVIPStatus(user.uid, true, plan.planName, plan.durationDays);
      updateMockUserProfile(user.uid, { 
          isVIP: true, 
          vipPack: plan.planName, 
          vipExpiryTimestamp: expiry,
          selectedVerifiedContacts: userProfile?.selectedVerifiedContacts || [], 
          hasMadeVipSelection: userProfile?.hasMadeVipSelection || false,
          points: updatedPoints,
      });
      setContextVIPStatus(true, plan.planName);
      
      setShowConfirmationDialog(true);
      
      toast({
          title: `VIP Activated: ${plan.planName}`,
          description: `Congratulations! Your VIP benefits are now active. Paid with points.`,
      });

    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not update your VIP status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
     setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    if (!user) return;
    setIsProcessing(true);
    setShowCancelDialog(false);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        await updateVIPStatus(user.uid, false);
        updateMockUserProfile(user.uid, { isVIP: false, vipPack: undefined, vipExpiryTimestamp: undefined });
        setContextVIPStatus(false, undefined);
        setRemainingTime(null);

        toast({
          title: "Subscription Cancelled",
          description: "Your VIP badge and benefits have been removed.",
          variant: "destructive",
          action: <Ban className="h-5 w-5 text-red-500" />,
        });
         router.push('/chat');

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        toast({
          title: "Cancellation Failed",
          description: "Could not cancel your VIP status. Please try again.",
          variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const closeConfirmationAndRedirect = () => {
    setShowConfirmationDialog(false);
    router.push('/chat');
  };

  const handleRedeemCode = async () => {
    if (!user || !userProfile) {
        toast({ title: "Not Logged In", description: "You must be logged in to redeem a code.", variant: "destructive" });
        router.push('/login');
        return;
    }
    if (!redeemCodeInput.trim()) {
        toast({ title: "Empty Redeem Code", description: "Please enter a redeem code.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    const code = redeemCodeInput.trim().toUpperCase();

    try {
        if (code.startsWith('VIP-')) {
            const result = await redeemVipPromoCode(user.uid, code);
            const planName = `VIP (${result.durationDays} days)`;
            
            const expiry = Date.now() + result.durationDays * 24 * 60 * 60 * 1000;
            updateMockUserProfile(user.uid, { 
                isVIP: true, 
                vipPack: planName, 
                vipExpiryTimestamp: expiry,
            });
            setContextVIPStatus(true, planName);
            
            setSubscribedPlan({ name: planName, features: ['VIP Badge', 'Exclusive Access'] });
            setShowConfirmationDialog(true);
            
            toast({
                title: "Code Redeemed!",
                description: `You have successfully activated ${result.durationDays} days of VIP access.`,
            });
        } else if (code.startsWith('PTS-')) {
            const result = await redeemPointsPromoCode(user.uid, code);
            updateMockUserProfile(user.uid, {
                points: (userProfile.points || 0) + result.amount,
            });
            toast({
                title: "Code Redeemed!",
                description: `You have received ${result.amount} points! Your new balance is ${(userProfile.points || 0) + result.amount}.`,
            });
        } else {
            throw new Error("Unknown code format. Please check the code and try again.");
        }

    } catch (error: any) {
        toast({ title: "Redemption Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
        setRedeemCodeInput('');
    }
};


  if (authLoading || isUserProfileLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading Subscription Status...</span>
        </div>
    );
  }

  const renderManageSubscription = () => (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-md mb-8 bg-premium-gradient">
        <CardHeader className="text-center">
          <Crown className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-primary" />
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Manage Your VIP Membership
          </CardTitle>
          <CardDescription className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground">
             You have the {userProfile?.vipPack || 'VIP'} badge!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {remainingTime ? (
            <div className="mb-4 p-3 bg-accent/50 rounded-md">
              <span className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4"/> Time Remaining:
              </span>
              <span className="text-lg font-semibold text-primary">{remainingTime}</span>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-accent/50 rounded-md">
                 <span className="text-lg font-semibold text-primary">You have Lifetime VIP!</span>
            </div>
          )}
          <span className="mb-4 text-muted-foreground">Want to change something? Contact support or cancel below.</span>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" disabled={isProcessing} onClick={() => toast({title: "Support Contacted", description:"Our team will get back to you shortly."})}>Contact Support</Button>
          {userProfile?.vipPack !== 'Lifetime VIP' && (
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel Subscription
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );

  const renderSubscribe = () => (
    <>
      <div className="text-center mb-8 md:mb-12">
        <Crown className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {hasVipBadge ? "Extend Your VIP Plan" : "Get a VIP Badge"}
        </h1>
        <span className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto block">
            {hasVipAccess && !hasVipBadge
              ? "You already have VIP feature access! Purchase a plan to get the exclusive VIP crown badge next to your name."
              : "Unlock exclusive features like the VIP theme, select verified users to chat with, get a VIP badge, and support Echo Message."
            }
        </span>
      </div>

      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/20">
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

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Heads Up!</AlertTitle>
        <AlertDescription>
          Buying VIP plan with money is not available now, but you can use points to buy it.
        </AlertDescription>
      </Alert>


       {isEligibleForLifetime && (
        <div className="mb-12 flex justify-center">
            <SubscriptionCard
                {...lifetimePlan}
                paymentMethod={paymentMethod}
                onSubscribe={() => handleSubscribe(lifetimePlan)}
            />
        </div>
       )}

      <Separator />

      <div className="text-center my-8">
            <h2 className="text-xl font-semibold">Or Choose a Timed Plan</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <SubscriptionCard
            key={index}
            {...plan}
            paymentMethod={paymentMethod}
            onSubscribe={() => handleSubscribe(plan)}
          />
        ))}
      </div>
      <div className="mt-8 md:mt-12 text-center text-muted-foreground text-xs md:text-sm">
        <span>Payments are processed securely.</span>
        <span>Need help? <Button variant="link" className="p-0 h-auto text-xs md:text-sm" onClick={() => toast({title: "Support Contacted", description:"Contacting support..."})}>Contact Support</Button></span>
      </div>
    </>
  );

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="w-full">
          {hasVipBadge && renderManageSubscription()}
          
          {renderSubscribe()}

          <Card className="w-full max-w-md mx-auto mt-12 bg-premium-gradient">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <Ticket className="h-6 w-6 text-primary" />
                      Redeem a Code
                  </CardTitle>
                  <CardDescription>Enter your code to activate a VIP plan or get points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div>
                      <Label htmlFor="redeem-code-input" className="sr-only">Redeem Code</Label>
                      <Input
                          id="redeem-code-input"
                          type="text"
                          placeholder="Enter your redeem code"
                          value={redeemCodeInput}
                          onChange={(e) => setRedeemCodeInput(e.target.value)}
                          className="text-base"
                          disabled={isProcessing}
                      />
                  </div>
                  <Button onClick={handleRedeemCode} className="w-full" disabled={isProcessing || !redeemCodeInput.trim()}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Redeem Code
                  </Button>
              </CardContent>
          </Card>
        </div>

        <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex justify-center mb-2">
                    <PartyPopper className={cn("h-12 w-12 text-primary", showConfirmationDialog && "animate-pulse")} />
                </div>
              <AlertDialogTitle className="text-center text-xl font-semibold">Congratulations!</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                You are now a VIP Member with the <strong>{subscribedPlan?.name}</strong> plan!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
                <h4 className="font-semibold text-center mb-3">You've unlocked:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground list-inside text-center">
                    {subscribedPlan?.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-center gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                  <Button onClick={closeConfirmationAndRedirect} className="w-full">Awesome!</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel VIP Subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your VIP subscription? You will lose access to your VIP badge and timed benefits.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelDialog(false)} disabled={isProcessing}>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                  onClick={confirmCancelSubscription}
                  className={buttonVariants({ variant: "destructive" })}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}
