// src/app/(app)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Crown, Settings, User, LogOut, Palette, Edit, MessageSquare, Loader2, Bell, Bot, Wrench, Info, Star } from 'lucide-react';
import { CreatorLetterCBBadgeIcon, SquareBotBadgeIcon } from '@/components/chat/bot-icons';
import { ChatList } from '@/components/chat/chat-list';
import { cn } from '@/lib/utils';
import { VIPProvider } from '@/context/vip-context';
import { ProfileSettingsDialog } from '@/components/settings/profile-settings-dialog';
import { AppearanceSettingsDialog } from '@/components/settings/appearance-settings-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { Logo } from '@/components/logo';
import { useAuth, type UserProfile } from '@/context/auth-context';
import { VerifiedBadge } from '@/components/verified-badge';
import { NotificationPopover } from '@/components/chat/notification-popover';
import { MusicPlayerProvider } from '@/context/music-player-context';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <VIPProvider>
        <MusicPlayerProvider>
          <AppLayout>{children}</AppLayout>
        </MusicPlayerProvider>
    </VIPProvider>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, userProfile: currentUserProfile, loading: authLoading, isUserProfileLoading, logout, updateMockUserProfile } = useAuth();

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isAppearanceDialogOpen, setAppearanceDialogOpen] = useState(false);
  const [isAboutDialogOpen, setAboutDialogOpen] = useState(false);

  const isViewingChat = /^\/chat\/[^/]+$/.test(pathname);
  const currentChatId = isViewingChat ? pathname.split('/')[2] : undefined;


  const handleLogout = async () => {
    console.log("AppLayout: Handling logout.");
    await logout();
    console.log("AppLayout: Logout processed. Middleware will redirect if necessary.");
  };

   const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
     if (!currentUser || !currentUserProfile) {
         console.error("AppLayout: Cannot update profile, current user or profile missing.");
         return;
     }
      console.log("AppLayout: Handling profile update.", updatedData);
      try {
          updateMockUserProfile(currentUser.uid, updatedData);
          console.log("AppLayout: Profile update request sent to AuthContext.");
      } catch (error) {
          console.error("AppLayout: Error processing profile update:", error);
      }
   };

  useEffect(() => {
    if (!authLoading && !currentUser && !isUserProfileLoading) {
      console.warn("AppLayout: No authenticated user after load. Redirecting to login.");
      router.replace('/login');
    }
  }, [authLoading, currentUser, isUserProfileLoading, router]);


   if (authLoading || (currentUser && isUserProfileLoading)) {
       return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-2 text-muted-foreground">Loading User Data...</p>
           </div>
       );
   }

    if (!authLoading && !currentUser && !isUserProfileLoading) {
        console.warn("AppLayout: No authenticated user after load. Preparing redirect to login.");
         return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                 <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                 <p className="ml-2 text-destructive">Redirecting to login...</p>
             </div>
         );
    }
  
    if (currentUser && !currentUserProfile && !isUserProfileLoading) {
         console.error("AppLayout: Authenticated user found but profile data is missing after load.");
         return (
             <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4 p-4 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                 <p className="text-destructive">Error: User profile data could not be loaded.</p>
                 <Button onClick={handleLogout} variant="outline" className="mt-2">Logout</Button>
             </div>
         );
    }
    
    if (!currentUserProfile && currentUser) { 
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background text-center p-4">
            <p className="text-destructive">Error: User profile is unexpectedly missing. Please try logging out and logging back in.</p>
            <Button onClick={handleLogout} variant="outline" className="mt-4">Logout</Button>
          </div>
        );
    }
    if(!currentUserProfile && !currentUser && !authLoading && !isUserProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-2 text-muted-foreground">Finalizing authentication...</p>
            </div>
        );
    }


  return (
    <div className={cn(
        "flex h-screen w-full bg-background flex-col md:flex-row"
        )}>
      <aside className="hidden md:flex md:flex-col w-80 border-r bg-secondary shrink-0">
         <div className="flex items-center justify-between p-4 border-b">
             <Link href="/chat" className="flex items-center gap-2">
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
                  />
                )}
              </div>
         </div>
        {currentUser && <ChatList currentChatId={currentChatId} currentUserId={currentUser.uid} />}
      </aside>

      <header className="md:hidden flex items-center justify-between p-3 border-b bg-secondary sticky top-0 z-10 shrink-0">
         <Link href="/chat" className="flex items-center gap-2">
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
              />
            )}
          </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
          <div className={cn("h-full md:hidden", {
              'hidden': isViewingChat || pathname !== '/chat', 
              'block': pathname === '/chat' && !isViewingChat,  
          })}>
            {pathname === '/chat' && !isViewingChat && currentUser && <ChatList currentChatId={undefined} currentUserId={currentUser.uid} />}
          </div>

          <div className={cn("h-full md:hidden", {
              'hidden': !isViewingChat && pathname === '/chat', 
              'block': isViewingChat || pathname !== '/chat', 
          })}>
              {children}
          </div>

         <div className="hidden md:flex h-full">
            {children}
         </div>
      </main>

      {currentUserProfile && (
        <>
          <ProfileSettingsDialog
            isOpen={isProfileDialogOpen}
            onOpenChange={setProfileDialogOpen}
            user={currentUserProfile} 
            onProfileUpdate={handleProfileUpdate}
          />
          <AppearanceSettingsDialog
            isOpen={isAppearanceDialogOpen}
            onOpenChange={setAppearanceDialogOpen}
          />
          <AboutDialog
            isOpen={isAboutDialogOpen}
            onOpenChange={setAboutDialogOpen}
          />
        </>
      )}
    </div>
  );
}

interface UserMenuProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenProfileSettings: () => void;
  onOpenAppearanceSettings: () => void;
  onOpenAboutDialog: () => void;
}

export type BadgeType = 'creator' | 'vip' | 'verified' | 'dev' | 'bot';

const BadgeComponents: Record<BadgeType, React.FC<{className?: string}>> = {
    creator: ({className}) => <CreatorLetterCBBadgeIcon className={cn("h-4 w-4", className)} />,
    vip: ({className}) => <Crown className={cn("h-4 w-4 text-yellow-500", className)} />,
    verified: ({className}) => <VerifiedBadge className={cn("h-4 w-4", className)} />,
    dev: ({className}) => <Wrench className={cn("h-4 w-4 text-blue-600", className)} />,
    bot: ({className}) => <SquareBotBadgeIcon className={cn("h-4 w-4", className)} />,
};


function UserMenu({ user, onLogout, onOpenProfileSettings, onOpenAppearanceSettings, onOpenAboutDialog }: UserMenuProps) {
   const fallbackInitials = user.name ? user.name.substring(0, 2).toUpperCase() : '??';

   const earnedBadges: BadgeType[] = [];
   if(user.isCreator) earnedBadges.push('creator');
   if(user.isVIP) earnedBadges.push('vip');
   // A Creator should not also show the Verified badge, as Creator implies verification.
   // But a regular verified user should see it.
   if(user.isVerified && !user.isCreator) earnedBadges.push('verified');
   if(user.isDevTeam) earnedBadges.push('dev');
   if(user.isBot) earnedBadges.push('bot');

   // Use the user's preferred order, but filter to only include badges they've actually earned.
   // Fallback to a default order if the user has no preference set.
   const badgeDisplayOrder = user.badgeOrder?.length ? user.badgeOrder : ['creator', 'vip', 'verified', 'dev', 'bot'];
   const orderedBadges = badgeDisplayOrder.filter(badge => earnedBadges.includes(badge));

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
          <DropdownMenuItem asChild>
             <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Chats</span>
              </Link>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={onOpenProfileSettings}>
             <Edit className="mr-2 h-4 w-4" />
             <span>Edit Profile</span>
           </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAppearanceSettings}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Theme</span>
            </DropdownMenuItem>
           <DropdownMenuItem asChild>
             <Link href="/subscribe">
               <Crown className="mr-2 h-4 w-4 text-yellow-500" />
               <span>{user.isVIP ? 'Manage VIP' : 'Get VIP'}</span>
             </Link>
         </DropdownMenuItem>
         <DropdownMenuItem asChild>
             <Link href="/settings">
               <Settings className="mr-2 h-4 w-4" />
               <span>More Settings</span>
             </Link>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/rate-report">
              <Star className="mr-2 h-4 w-4" />
              <span>Rate &amp; Report</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenAboutDialog}>
             <Info className="mr-2 h-4 w-4" />
             <span>About</span>
           </DropdownMenuItem>
         <DropdownMenuItem onClick={onLogout}>
           <LogOut className="mr-2 h-4 w-4" />
           <span>Log out</span>
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
}
