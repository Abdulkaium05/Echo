
// src/components/chat/chat-list.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatItem, type ChatItemProps } from './chat-item';
import { Search, Users, MessageCircle, UserPlus, Loader2, AlertCircle, Edit, Leaf } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AddContactDialog } from './add-contact-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserChats, mapChatToChatItem, type Chat, getVerifiedContactLimit, DEV_UID, getUserProfile, type UserProfile, BOT_UID } from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { SelectVerifiedDialog } from './select-verified-dialog';
import { useToast } from '@/hooks/use-toast';
import { useBlockUser } from '@/context/block-user-context';
import { useTrash } from '@/context/trash-context'; 
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
import { UserProfileDialog } from '../profile/user-profile-dialog';

interface ChatListProps {
  currentChatId?: string;
  currentUserId: string | null | undefined;
}

export function ChatList({ currentChatId, currentUserId }: ChatListProps) {
  const { userProfile, isUserProfileLoading } = useAuth();
  const { toast } = useToast();
  const { addBlockedUser, unblockUser, isUserBlocked } = useBlockUser();
  const { trashChat, isChatTrashed } = useTrash();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isSelectVerifiedOpen, setIsSelectVerifiedOpen] = useState(false);
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'block' | 'delete' | 'unblock' | null;
    userId?: string;
    chatId?: string;
    userName?: string;
    chatItem?: ChatItemProps;
  }>({ isOpen: false, type: null });

  const [profileDialogState, setProfileDialogState] = useState<{
    isOpen: boolean;
    profile: UserProfile | null;
  }>({ isOpen: false, profile: null });
  
  const [currentTheme, setCurrentTheme] = useState('theme-sky-blue');

  useEffect(() => {
    // This effect ensures the component re-renders when the theme is toggled globally.
    if (typeof window === 'undefined') return;

    const checkGlobalTheme = () => {
        const savedTheme = localStorage.getItem('theme_color') || 'theme-sky-blue';
        setCurrentTheme(savedTheme);
    };
    checkGlobalTheme();

    // Also listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'theme_color') {
            checkGlobalTheme();
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const hasVIPAccess = userProfile?.isVIP || userProfile?.isVerified || userProfile?.isCreator || userProfile?.isDevTeam;
  
  const vipLimit = (userProfile?.isVerified || userProfile?.isCreator) 
    ? Number.MAX_SAFE_INTEGER 
    : getVerifiedContactLimit(userProfile?.vipPack);
  
  useEffect(() => {
    if (!currentUserId) {
        console.warn("ChatList: No current user ID provided. Waiting for auth.");
        setLoading(false);
        return;
    }

    if (isUserProfileLoading || !userProfile) {
        setLoading(true); // Keep showing loading until profile is ready
        return;
    }

    setLoading(true);
    setError(null);
    setChats([]);
    
    console.log("ChatList: Subscribing to chats for user:", currentUserId);
    
    // Pass the userProfile directly to the subscription function
    const unsubscribe = getUserChats(
        currentUserId,
        userProfile, 
        (fetchedChats: Chat[]) => {
            console.log(`ChatList: Received ${fetchedChats.length} chats for user ${currentUserId}`);
            const chatItems = fetchedChats.map(chat => mapChatToChatItem(
                chat, 
                currentUserId,
            ));
            setChats(chatItems);
            setLoading(false);
        },
        (err) => {
            console.error("ChatList: Error fetching chats:", err);
            setError(err.message || "Failed to load chats.");
            setLoading(false);
        }
    );

    return () => {
        console.log("ChatList: Unsubscribing from chats for user:", currentUserId);
        unsubscribe();
    };
  }, [currentUserId, userProfile, isUserProfileLoading]);


  const handleBlockUser = (userId: string, userName: string) => {
    setDialogState({ isOpen: true, type: 'block', userId, userName });
  };

  const handleUnblockUser = (userId: string, userName: string) => {
    setDialogState({ isOpen: true, type: 'unblock', userId, userName });
  };

  const handleDeleteChat = (chatItem: ChatItemProps) => {
    setDialogState({ isOpen: true, type: 'delete', chatId: chatItem.id, userName: chatItem.name, chatItem });
  };
  
  const handleViewProfile = async (userId: string) => {
    const profile = await getUserProfile(userId);
    if (profile) {
      setProfileDialogState({ isOpen: true, profile });
    } else {
      toast({ title: 'Error', description: 'Could not load user profile.', variant: 'destructive'});
    }
  };

  const confirmBlockUser = () => {
    if (dialogState.userId) {
      addBlockedUser(dialogState.userId);
      toast({
        title: `User Blocked`,
        description: `You have blocked ${dialogState.userName}. You can unblock them from the chat list.`,
        variant: "destructive"
      });
    }
    setDialogState({ isOpen: false, type: null });
  };

  const confirmUnblockUser = () => {
    if (dialogState.userId) {
      unblockUser(dialogState.userId);
      toast({
        title: `User Unblocked`,
        description: `You can now chat with ${dialogState.userName} again.`,
      });
    }
    setDialogState({ isOpen: false, type: null });
  };

  const confirmDeleteChat = () => {
    if (dialogState.chatItem) {
      trashChat(dialogState.chatItem);
      toast({
        title: `Chat with ${dialogState.userName} moved to Trash`,
        description: "You can restore it from Settings.",
        variant: "destructive"
      });
    }
    setDialogState({ isOpen: false, type: null });
  };

  const allMatchingChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) && !isChatTrashed(chat.id)
  );

  // Sort chats by timestamp, but keep Dev Team chat at the bottom
  const sortedChats = allMatchingChats.sort((a, b) => b.lastMessageTimestampValue - a.lastMessageTimestampValue);
  const devTeamChatIndex = sortedChats.findIndex(chat => chat.contactUserId === DEV_UID);
  if (devTeamChatIndex > -1) {
    const [devTeamChat] = sortedChats.splice(devTeamChatIndex, 1);
    sortedChats.push(devTeamChat);
  }
  
    if (loading) {
        return (
            <div className="flex flex-col h-full bg-secondary items-center justify-center p-4">
                 <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                 <p className="text-sm text-muted-foreground">Loading Chats...</p>
            </div>
        );
    }

     if (error) {
         return (
             <div className="flex flex-col h-full bg-secondary items-center justify-center p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm font-medium text-destructive">Error Loading Chats</p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
             </div>
         );
     }

     if (!currentUserId && !loading) {
         return (
             <div className="flex flex-col h-full bg-secondary items-center justify-center p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Please log in to view chats.</p>
             </div>
         );
     }

     const renderChatItems = (chatItems: ChatItemProps[]) => {
        return chatItems.map((chat) => {
            const isBotChat = chat.contactUserId === BOT_UID;
            const isGreenTheme = currentTheme === 'theme-light-green';
            const botName = isGreenTheme ? 'Green Leaf' : 'Blue Bird (AI Assistant)';
            
            const itemProps = { ...chat };
            if (isBotChat) {
                itemProps.name = botName;
                itemProps.iconIdentifier = isGreenTheme ? 'green-leaf-icon' : 'outline-bird-avatar';
            }

            return (
                <ChatItem 
                    key={itemProps.id} 
                    {...itemProps} 
                    isActive={itemProps.id === currentChatId}
                    isBlocked={isUserBlocked(itemProps.contactUserId)}
                    onBlockUser={handleBlockUser}
                    onUnblockUser={handleUnblockUser}
                    onDeleteChat={handleDeleteChat}
                    onViewProfile={handleViewProfile}
                />
            );
        });
     }

  return (
    <>
    <TooltipProvider>
      <div className="flex flex-col h-full bg-secondary">
        <div className="p-4 border-b flex items-center gap-2 sticky top-0 bg-secondary z-10">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chats..."
              className="pl-8 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setIsAddContactOpen(true)}
                    disabled={!currentUserId}
                    aria-label="Add Contact by Email"
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent><p>Add Contact by Email</p></TooltipContent>
            </Tooltip>
           {hasVIPAccess && (
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="shrink-0"
                   onClick={() => setIsSelectVerifiedOpen(true)}
                 >
                   <Edit className="h-5 w-5" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent><p>Select Verified Users</p></TooltipContent>
             </Tooltip>
           )}
        </div>

        <ScrollArea className="flex-1">
           {sortedChats.length > 0 ? (
                <div className="p-2 pt-3 space-y-1">
                    {renderChatItems(sortedChats)}
                </div>
            ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                    {searchTerm ? `No chats found for "${searchTerm}"` : "No chats found. Add a contact to start messaging!"}
                </p>
            )}
        </ScrollArea>

        {currentUserId && (
            <AddContactDialog
                isOpen={isAddContactOpen}
                onOpenChange={setIsAddContactOpen}
                currentUserId={currentUserId}
            />
        )}
        {hasVIPAccess && currentUserId && userProfile && (
             <SelectVerifiedDialog
                isOpen={isSelectVerifiedOpen}
                onOpenChange={setIsSelectVerifiedOpen}
                limit={vipLimit}
             />
        )}
      </div>
    </TooltipProvider>

      <AlertDialog open={dialogState.isOpen} onOpenChange={() => setDialogState({ isOpen: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.type === 'block' ? `Block ${dialogState.userName}?` :
               dialogState.type === 'unblock' ? `Unblock ${dialogState.userName}?` :
               `Delete Chat with ${dialogState.userName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'block'
                ? `You will not be able to send or receive messages from this user until you unblock them.`
                : dialogState.type === 'unblock'
                ? `You will be able to send and receive messages with this user again.`
                : `This will move the chat to the Trash. You can restore it later from Settings.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: (dialogState.type === 'block' || dialogState.type === 'delete') ? "destructive" : "default" })}
              onClick={() => {
                if (dialogState.type === 'block') {
                  confirmBlockUser();
                } else if (dialogState.type === 'unblock') {
                  confirmUnblockUser();
                } else if (dialogState.type === 'delete') {
                  confirmDeleteChat();
                }
              }}
            >
              {dialogState.type === 'block' ? 'Block' : dialogState.type === 'unblock' ? 'Unblock' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserProfileDialog 
        isOpen={profileDialogState.isOpen}
        onOpenChange={(open) => setProfileDialogState({ isOpen: open, profile: open ? profileDialogState.profile : null })}
        profile={profileDialogState.profile}
      />
    </>
  );
}
