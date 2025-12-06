



'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Crown, Settings, User, LogOut, Palette, Edit, MessageSquare, Loader2, Bell, Bot, Wrench, Info, QrCode, Camera, Coins, History, SmilePlus, FlaskConical, Rocket, Gem, Code, Gift } from 'lucide-react';
import { CreatorLetterCBBadgeIcon, SquareBotBadgeIcon } from '@/components/chat/bot-icons';
import { ChatList } from '@/components/chat/chat-list';
import { cn } from '@/lib/utils';
import { ProfileSettingsDialog } from '@/components/settings/profile-settings-dialog';
import { AppearanceSettingsDialog } from '@/components/settings/appearance-settings-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { Logo } from '@/components/logo';
import { useAuth, type UserProfile } from '@/context/auth-context';
import { VerifiedBadge } from '@/components/verified-badge';
import { NotificationPopover } from '@/components/chat/notification-popover';
import { ShareProfileDialog } from '@/components/profile/share-profile-dialog';
import { GiftBadgeDialog } from '@/components/dev/gift-badge-dialog';
import { GiftReceivedDialog } from '@/components/dev/gift-received-dialog';
import { ScanQrDialog } from '@/components/chat/scan-qr-dialog';
import { PointsReceivedDialog } from '@/components/dev/points-received-dialog';
import { CompleteProfileDialog } from '@/components/auth/complete-profile-dialog';
import { EchoOldDialog } from '@/components/echo-old-dialog';
import { Toaster } from '@/components/ui/toaster';
import { GiftHistoryDialog } from '@/components/profile/gift-history-dialog';

export type BadgeType = 'creator' | 'vip' | 'verified' | 'dev' | 'bot' | 'meme_creator' | 'beta_tester' | 'pioneer' | 'patron';
export type BadgeColor = 'sky-blue' | 'light-green' | 'red' | 'orange' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'teal' | 'white' | 'black';

const BadgeComponents: Record<BadgeType, React.FC<{className?: string}>> = {
    creator: ({className}) => <CreatorLetterCBBadgeIcon className={cn("h-4 w-4", className)} />,
    vip: ({className}) => <Crown className={cn("h-4 w-4 text-yellow-500", className)} />,
    verified: ({className}) => <VerifiedBadge className={cn("h-4 w-4", className)} />,
    dev: ({className}) => <Wrench className={cn("h-4 w-4 text-blue-600", className)} />,
    bot: ({className}) => <SquareBotBadgeIcon className={cn("h-4 w-4", className)} />,
    meme_creator: ({className}) => <SmilePlus className={cn("h-4 w-4 text-green-500", className)} />,
    beta_tester: ({className}) => <FlaskConical className={cn("h-4 w-4 text-orange-500", className)} />,
    pioneer: ({ className }) => <Rocket className={cn("h-4 w-4 text-slate-500", className)} />,
    patron: ({ className }) => <Gem className={cn("h-4 w-4 text-rose-500", className)} />,
};


function UserMenu({ user, onLogout, onOpenProfileSettings, onOpenAppearanceSettings, onOpenAboutDialog, onOpenShareProfileDialog, onOpenGiftBadgeDialog, onOpenScanQrDialog, onOpenEchoOldDialog, onOpenGiftHistoryDialog }: { 
    user: UserProfile, 
    onLogout: () => void, 
    onOpenProfileSettings: () => void,
    onOpenAppearanceSettings: () => void,
    onOpenAboutDialog: () => void,
    onOpenShareProfileDialog: () => void;
    onOpenGiftBadgeDialog: () => void;
    onOpenScanQrDialog: () => void;
    onOpenEchoOldDialog: () => void;
    onOpenGiftHistoryDialog: () => void;
}) {
   const router = useRouter();
   const fallbackInitials = user.name ? user.name.substring(0, 2).toUpperCase() : '??';

   const earnedBadges: BadgeType[] = [];
   if(user.isCreator) earnedBadges.push('creator');
   if(user.isVIP) earnedBadges.push('vip');
   if(user.isVerified) earnedBadges.push('verified');
   if(user.isDevTeam) earnedBadges.push('dev');
   if(user.isBot) earnedBadges.push('bot');
   if(user.isMemeCreator) earnedBadges.push('meme_creator');
   if(user.isBetaTester) earnedBadges.push('beta_tester');
   if(user.isPioneer) earnedBadges.push('pioneer');
   if(user.isPatron) earnedBadges.push('patron');

   const badgeDisplayOrder = user.badgeOrder?.length ? user.badgeOrder : allPossibleBadges;
   const orderedBadges = badgeDisplayOrder.filter(badge => earnedBadges.includes(badge)).slice(0, 2);

   const isDev = user.isDevTeam;
   
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" className="relative h-8 w-8 rounded-full">
           <Avatar className="h-8 w-8">
             <AvatarImage src={user.avatarUrl} alt={user.name || 'User Avatar'} data-ai-hint="user avatar"/>
             <AvatarFallback>{fallbackInitials}</AvatarFallback>
           </Avatar>
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent className="w-56" align="end" forceMount>
         <DropdownMenuLabel className="font-normal">
           <div className="flex flex-col space-y-1">
             <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                <span className="truncate">{user.name || 'User'}</span>
                {orderedBadges.map(badgeKey => {
                    const BadgeComponent = BadgeComponents[badgeKey];
                    return BadgeComponent ? <BadgeComponent key={badgeKey} className="shrink-0" /> : null;
                })}
             </p>
             <p className="text-xs leading-none text-muted-foreground">
               {user.email}
             </p>
           </div>
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/chat')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Chats</span>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={onOpenProfileSettings}>
             <Edit className="mr-2 h-4 w-4" />
             <span>Edit Profile</span>
           </DropdownMenuItem>
           <DropdownMenuItem onClick={onOpenShareProfileDialog}>
             <QrCode className="mr-2 h-4 w-4" />
             <span>Share Profile</span>
           </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAppearanceSettings}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Theme</span>
            </DropdownMenuItem>
           <DropdownMenuItem onClick={() => router.push('/subscribe')}>
               <Crown className="mr-2 h-4 w-4 text-yellow-500" />
               <span>{user.isVIP ? 'Manage VIP' : 'Get VIP'}</span>
           </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenScanQrDialog}>
                <Camera className="mr-2 h-4 w-4" />
                <span>Scan QR Code</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/points')}>
                <Coins className="mr-2 h-4 w-4" />
                <span>Points</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenGiftHistoryDialog}>
                <History className="mr-2 h-4 w-4" />
                <span>Gift History</span>
            </DropdownMenuItem>
            {isDev && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dev-tools')}>
                  <Code className="mr-2 h-4 w-4" />
                  <span>Developer Tools</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenGiftBadgeDialog}>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>Gift a Badge</span>
                </DropdownMenuItem>
              </>
            )}
         <DropdownMenuItem onClick={() => router.push('/settings')}>
               <Settings className="mr-2 h-4 w-4" />
               <span>More Settings</span>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenAboutDialog}>
             <Info className="mr-2 h-4 w-4" />
             <span>About</span>
           </DropdownMenuItem>
           <DropdownMenuItem onClick={onOpenEchoOldDialog}>
              <History className="mr-2 h-4 w-4" />
              <span>Echo-Old</span>
          </DropdownMenuItem>
         <DropdownMenuItem onClick={onLogout}>
           <LogOut className="mr-2 h-4 w-4" />
           <span>Log out</span>
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
}

const allPossibleBadges: BadgeType[] = ['creator', 'vip', 'verified', 'dev', 'bot', 'meme_creator', 'beta_tester', 'pioneer', 'patron'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, userProfile: currentUserProfile, loading: authLoading, isUserProfileLoading, logout, updateUserProfile, giftInfo, setGiftInfo, pointsGiftInfo, setPointsGiftInfo } = useAuth();

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isAppearanceDialogOpen, setAppearanceDialogOpen] = useState(false);
  const [isAboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [isShareProfileDialogOpen, setShareProfileDialogOpen] = useState(false);
  const [isGiftBadgeDialogOpen, setIsGiftBadgeDialogOpen] = useState(false);
  const [isGiftReceivedDialogOpen, setIsGiftReceivedDialogOpen] = useState(false);
  const [isPointsReceivedDialogOpen, setIsPointsReceivedDialogOpen] = useState(false);
  const [isScanQrDialogOpen, setIsScanQrDialogOpen] = useState(false);
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);
  const [isEchoOldDialogOpen, setIsEchoOldDialogOpen] = useState(false);
  const [isGiftHistoryDialogOpen, setIsGiftHistoryDialogOpen] = useState(false);

  useEffect(() => {
    if (giftInfo.gifterProfile && giftInfo.giftedBadge) {
      setIsGiftReceivedDialogOpen(true);
    } else {
      setIsGiftReceivedDialogOpen(false);
    }
  }, [giftInfo]);

  useEffect(() => {
    if (pointsGiftInfo.gifterProfile && pointsGiftInfo.giftedPointsAmount) {
        setIsPointsReceivedDialogOpen(true);
    } else {
        setIsPointsReceivedDialogOpen(false);
    }
  }, [pointsGiftInfo]);

  useEffect(() => {
      if (currentUserProfile && !currentUserProfile.hasCompletedOnboarding && !isUserProfileLoading) {
          setIsCompleteProfileOpen(true);
      } else {
          setIsCompleteProfileOpen(false);
      }
  }, [currentUserProfile, isUserProfileLoading]);


  const handleCloseGiftDialog = () => {
    setIsGiftReceivedDialogOpen(false);
    setGiftInfo({ gifterProfile: null, giftedBadge: null });
  };
  
  const handleClosePointsGiftDialog = () => {
    setIsPointsReceivedDialogOpen(false);
    setPointsGiftInfo({ gifterProfile: null, giftedPointsAmount: null });
  };

  const isChatPage = /^\/chat(\/.*)?$/.test(pathname);
  const isViewingChat = /^\/chat\/[^/]+$/.test(pathname);
  const currentChatId = isViewingChat ? pathname.split('/')[2] : undefined;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

   const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
     if (!currentUser) return;
      updateUserProfile(updatedData);
   };

  useEffect(() => {
    if (!authLoading && !isUserProfileLoading) {
      if (!currentUser) {
        router.replace('/login');
      } else if (!currentUser.emailVerified) {
        router.replace('/verify-email');
      }
    }
  }, [authLoading, isUserProfileLoading, currentUser, router]);

  const isAuthPage = ['/login', '/signup', '/verify-email'].includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

   if (authLoading || (currentUser && isUserProfileLoading)) {
       return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-2 text-muted-foreground">Loading User Data...</p>
           </div>
       );
   }

    if (!currentUser || !currentUser.emailVerified) {
         return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                 <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                 <p className="ml-2 text-destructive">Redirecting...</p>
             </div>
         );
    }
  
    if (!currentUserProfile) {
         return (
             <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4 p-4 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                 <p className="text-destructive">Error: User profile data could not be loaded.</p>
                 <Button onClick={handleLogout} variant="outline" className="mt-2">Logout</Button>
             </div>
         );
    }

  return (
    <>
      <div className={cn(
          "flex h-screen w-full bg-background flex-col md:flex-row"
          )}>
        <aside className="hidden md:flex md:flex-col w-80 border-r bg-secondary shrink-0">
           <div className="flex items-center justify-between p-4 border-b">
               <Link href="/chat">
                  <Logo className="h-8" />
               </Link>
                <div className="flex items-center gap-2">
                  <NotificationPopover />
                  {currentUserProfile && (
                    <UserMenu
                        user={currentUserProfile}
                        onLogout={handleLogout}
                        onOpenProfileSettings={() => setProfileDialogOpen(true)}
                        onOpenAppearanceSettings={() => setAppearanceDialogOpen(true)}
                        onOpenAboutDialog={() => setAboutDialogOpen(true)}
                        onOpenShareProfileDialog={() => setShareProfileDialogOpen(true)}
                        onOpenGiftBadgeDialog={() => setIsGiftBadgeDialogOpen(true)}
                        onOpenScanQrDialog={() => setIsScanQrDialogOpen(true)}
                        onOpenEchoOldDialog={() => setIsEchoOldDialogOpen(true)}
                        onOpenGiftHistoryDialog={() => setIsGiftHistoryDialogOpen(true)}
                    />
                  )}
                </div>
           </div>
          {currentUser && <ChatList currentChatId={currentChatId} currentUserId={currentUser.uid} />}
        </aside>

        <header className="md:hidden flex items-center justify-between p-3 border-b bg-secondary sticky top-0 z-10 shrink-0">
           <Link href="/chat">
               <Logo className="h-8" />
           </Link>
            <div className="flex items-center gap-2">
              <NotificationPopover />
              {currentUserProfile && (
                <UserMenu
                    user={currentUserProfile}
                    onLogout={handleLogout}
                    onOpenProfileSettings={() => setProfileDialogOpen(true)}
                    onOpenAppearanceSettings={() => setAppearanceDialogOpen(true)}
                    onOpenAboutDialog={() => setAboutDialogOpen(true)}
                    onOpenShareProfileDialog={() => setShareProfileDialogOpen(true)}
                    onOpenGiftBadgeDialog={() => setIsGiftBadgeDialogOpen(true)}
                    onOpenScanQrDialog={() => setIsScanQrDialogOpen(true)}
                    onOpenEchoOldDialog={() => setIsEchoOldDialogOpen(true)}
                    onOpenGiftHistoryDialog={() => setIsGiftHistoryDialogOpen(true)}
                />
              )}
            </div>
        </header>

        <main className="flex-1 flex flex-col overflow-y-auto">
            {/* Mobile Chat List View */}
            <div className={cn("h-full md:hidden", {
                'block': pathname === '/chat', // Show only on the main chat list page
                'hidden': pathname !== '/chat',
            })}>
              {currentUser && <ChatList currentChatId={currentChatId} currentUserId={currentUser.uid} />}
            </div>

            {/* Mobile Content View (for individual chats AND other pages) */}
            <div className={cn("h-full", {
                'block': pathname !== '/chat', // Show for any page that is NOT the main chat list
                'hidden': pathname === '/chat',
                'md:block': !isChatPage, // On desktop, show if not a chat page at all
                'md:flex-1 md:flex md:flex-col': isChatPage && isViewingChat, // Correctly handle flex for chat window
                'md:hidden': isChatPage && !isViewingChat, // On desktop, hide if on main chat list
            })}>
                {children}
            </div>
        </main>
      </div>

      {currentUserProfile && (
        <>
          {currentUser && (
             <CompleteProfileDialog 
                isOpen={isCompleteProfileOpen}
                onOpenChange={setIsCompleteProfileOpen}
                user={currentUserProfile}
                onProfileUpdate={handleProfileUpdate}
             />
          )}
          <ProfileSettingsDialog
            isOpen={isProfileDialogOpen}
            onOpenChange={setProfileDialogOpen}
            user={currentUserProfile}
          />
          <AppearanceSettingsDialog
            isOpen={isAppearanceDialogOpen}
            onOpenChange={setAppearanceDialogOpen}
          />
          <AboutDialog
            isOpen={isAboutDialogOpen}
            onOpenChange={setAboutDialogOpen}
          />
          <ShareProfileDialog
            isOpen={isShareProfileDialogOpen}
            onOpenChange={setShareProfileDialogOpen}
            user={currentUserProfile}
          />
          <GiftBadgeDialog
            isOpen={isGiftBadgeDialogOpen}
            onOpenChange={setIsGiftBadgeDialogOpen}
          />
           <GiftReceivedDialog 
                isOpen={isGiftReceivedDialogOpen}
                onOpenChange={handleCloseGiftDialog}
                gifterProfile={giftInfo.gifterProfile}
                giftedBadge={giftInfo.giftedBadge}
            />
            <PointsReceivedDialog
                isOpen={isPointsReceivedDialogOpen}
                onOpenChange={handleClosePointsGiftDialog}
                gifterProfile={pointsGiftInfo.gifterProfile}
                giftedPointsAmount={pointsGiftInfo.giftedPointsAmount}
            />
            <ScanQrDialog
                isOpen={isScanQrDialogOpen}
                onOpenChange={setIsScanQrDialogOpen}
            />
             <EchoOldDialog
              isOpen={isEchoOldDialogOpen}
              onOpenChange={setIsEchoOldDialogOpen}
            />
            <GiftHistoryDialog
              isOpen={isGiftHistoryDialogOpen}
              onOpenChange={setIsGiftHistoryDialogOpen}
            />
        </>
      )}
      <Toaster />
    </>
  );
}
