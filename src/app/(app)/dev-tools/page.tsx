
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code, Gift, QrCode, History, Coins, Users, Lightbulb, Badge, MoreVertical, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VipCodeGeneratorTab } from '@/components/dev/tools/vip-code-generator';
import { BadgeQrGeneratorTab } from '@/components/dev/tools/badge-qr-generator';
import { PointsCodeGeneratorTab } from '@/components/dev/tools/points-code-generator';
import { CodeHistoryTab } from '@/components/dev/tools/code-history';
import { NewUsersTab } from '@/components/dev/tools/new-users-tab';
import { SuggestionsTab } from '@/components/dev/tools/suggestions-tab';
import { GiftBadgeDialog } from '@/components/dev/gift-badge-dialog';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


function DevAuthDialog({ onAuthenticated }: { onAuthenticated: () => void }) {
    const [password, setPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleAuth = () => {
        setIsAuthenticating(true);
        setError('');
        
        // Simulate a slight delay
        setTimeout(() => {
            if (password === '190524') {
                toast({
                    title: "Access Granted",
                    description: "Developer tools unlocked for this session.",
                    action: <ShieldCheck className="h-5 w-5 text-green-500" />
                });
                onAuthenticated();
            } else {
                setError('Incorrect password. Please try again.');
                toast({
                    title: "Access Denied",
                    description: "The password you entered is incorrect.",
                    variant: "destructive",
                });
            }
            setIsAuthenticating(false);
            setPassword('');
        }, 500);
    };

    return (
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Developer Authentication
                    </DialogTitle>
                    <DialogDescription>
                        Please enter the password to access developer tools.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="dev-password">Password</Label>
                        <Input
                            id="dev-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                            disabled={isAuthenticating}
                        />
                         {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                     <Button type="button" variant="secondary" asChild>
                        <Link href="/chat">Cancel</Link>
                     </Button>
                    <Button type="button" onClick={handleAuth} disabled={isAuthenticating || !password}>
                        {isAuthenticating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Unlock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DevToolsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [isGiftBadgeOpen, setIsGiftBadgeOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('promo');
  const [isDevToolsUnlocked, setIsDevToolsUnlocked] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isDevTeamUser = userProfile?.isDevTeam === true;
  
  useEffect(() => {
    // Check session storage on component mount
    if (sessionStorage.getItem('devToolsAuthenticated') === 'true') {
      setIsDevToolsUnlocked(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleAuthenticationSuccess = () => {
    sessionStorage.setItem('devToolsAuthenticated', 'true');
    setIsDevToolsUnlocked(true);
  };

  if (authLoading || isCheckingAuth) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!isDevTeamUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
        <Code className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          This feature is for administrative purposes and is not available.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/chat">
              Go Back to Chats
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!isDevToolsUnlocked) {
    return <DevAuthDialog onAuthenticated={handleAuthenticationSuccess} />;
  }


  return (
    <>
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Developer Tools
            </h1>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
            <div className="w-full overflow-x-auto pb-2">
                <TabsList className="flex items-center gap-1 w-min">
                    <TabsTrigger value="promo">
                        <Gift className="mr-2 h-4 w-4" />
                        VIP Code
                    </TabsTrigger>
                    <TabsTrigger value="qr">
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                    </TabsTrigger>
                    <TabsTrigger value="points">
                        <Coins className="mr-2 h-4 w-4" />
                        Points Code
                    </TabsTrigger>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsGiftBadgeOpen(true)}>
                            <Badge className="mr-2 h-4 w-4" />
                            <span>Gift a Badge</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCurrentTab('history')}>
                          <History className="mr-2 h-4 w-4" />
                          <span>History</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCurrentTab('users')}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>New Users</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCurrentTab('suggestions')}>
                          <Lightbulb className="mr-2 h-4 w-4" />
                          <span>Suggestions</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TabsList>
            </div>
            
            <TabsContent value="promo" className="flex-1 mt-6">
                <VipCodeGeneratorTab />
            </TabsContent>
            <TabsContent value="qr" className="flex-1 mt-6">
                <BadgeQrGeneratorTab />
            </TabsContent>
            <TabsContent value="points" className="flex-1 mt-6">
                <PointsCodeGeneratorTab />
            </TabsContent>
            <TabsContent value="history" className="flex-1 mt-6">
                <CodeHistoryTab />
            </TabsContent>
            <TabsContent value="users" className="flex-1 mt-6">
                <NewUsersTab />
            </TabsContent>
            <TabsContent value="suggestions" className="flex-1 mt-6">
                <SuggestionsTab />
            </TabsContent>
        </Tabs>
    </div>
    <GiftBadgeDialog isOpen={isGiftBadgeOpen} onOpenChange={setIsGiftBadgeOpen} />
    </>
  );
}
