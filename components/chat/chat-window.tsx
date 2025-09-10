// src/components/chat/chat-window.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { MessageInput, type MessageInputHandle } from './message-input';
import { VerifiedBadge } from '@/components/verified-badge';
import { ArrowLeft, Phone, Video, Loader2, ShieldAlert, RefreshCw, Wrench, Crown, MoreVertical, Palette, X, Ban } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    getChatMessages,
    sendMessage as sendMessageToChat, 
    deleteMessage as deleteMessageFromService,
    toggleReaction as toggleReactionOnService,
    type Message,
    formatTimestamp,
    getUserProfile as fetchChatPartnerProfile,
    type UserProfile,
    BOT_UID,
    DEV_UID,
    formatLastSeen,
    markMessagesAsSeen,
} from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { UserProfileDialog } from '@/components/profile/user-profile-dialog';
import { cn } from "@/lib/utils";
import { OutlineBirdIcon, SquareBotBadgeIcon, CreatorLetterCBBadgeIcon } from './bot-icons'; // Changed import
import { useMusicPlayer } from '@/context/music-player-context';
import { AudioCallDialog } from './audio-call-dialog'; // Import the new component
import { useSound } from '@/context/sound-context';
import { useVIP } from '@/context/vip-context';

interface ChatWindowProps {
  chatId: string;
  chatPartnerId: string;
  chatName: string;
  chatAvatarUrl?: string;
  chatIconIdentifier?: 'dev-team-svg';
  isVerified?: boolean; // General verified status
  isVIP?: boolean;
  isCreator?: boolean; // Added isCreator for badge display
}


const DevTeamAvatarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);


export function ChatWindow({ chatId, chatPartnerId, chatName, chatAvatarUrl, chatIconIdentifier, isVerified, isVIP, isCreator }: ChatWindowProps) {
  const { user: currentUser, userProfile, updateMockUserProfile } = useAuth();
  const { hasVipAccess } = useVIP();
  const { toast } = useToast();
  const { url: songUrl } = useMusicPlayer();
  const { playSound } = useSound();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputHandle>(null);
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [isPartnerProfileDialogOpen, setPartnerProfileDialogOpen] = useState(false);
  const [partnerProfileDetails, setPartnerProfileDetails] = useState<UserProfile | null>(null);
  const [partnerOnlineStatus, setPartnerOnlineStatus] = useState<string>('Loading...');

  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isAudioCallDialogOpen, setIsAudioCallDialogOpen] = useState(false);
  const [isTransparentMode, setIsTransparentMode] = useState(false);
  
  const previousMessagesCountRef = useRef(0);

  const customBubbleColor = userProfile?.chatColorPreferences?.[chatId];
  const amBlockedByPartner = partnerProfileDetails?.blockedUsers?.includes(currentUser?.uid ?? '') ?? false;


  useEffect(() => {
    // This effect ensures the component re-renders when transparent mode is toggled globally.
    if (typeof window === 'undefined') return;

    // Initial check
    const checkTransparentMode = () => {
        const isTransparent = document.documentElement.classList.contains('transparent-mode');
        setIsTransparentMode(isTransparent);
    };
    checkTransparentMode();

    // Set up an observer to watch for class changes on the <html> element
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                checkTransparentMode();
            }
        }
    });

    observer.observe(document.documentElement, { attributes: true });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);

  const handleBubbleColorChange = (color: string | null) => {
    if (!currentUser || !userProfile) {
        toast({ title: "Error", description: "You must be logged in to change settings.", variant: "destructive" });
        return;
    }

    const newPreferences = { ...userProfile.chatColorPreferences, [chatId]: color };
    updateMockUserProfile(currentUser.uid, { chatColorPreferences: newPreferences });
    toast({
        title: "Bubble Color Updated",
        description: `Chat bubbles for this conversation are now ${color ? color.replace('-', ' ') : 'default'}.`
    });
  };

  useEffect(() => {
    const fetchPartnerStatus = async () => {
        if (!chatPartnerId) return;
        const profile = await fetchChatPartnerProfile(chatPartnerId);
        setPartnerProfileDetails(profile);
        if (profile) {
            setPartnerOnlineStatus(formatLastSeen(profile.lastSeen));
        } else {
            setPartnerOnlineStatus('Offline');
        }
    };
    fetchPartnerStatus();

    const intervalId = setInterval(fetchPartnerStatus, 30000); // Re-check every 30 seconds
    return () => clearInterval(intervalId);
  }, [chatPartnerId]);


  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
        const viewport = scrollViewportRef.current;
        if (viewport) {
              viewport.scrollTo({ top: viewport.scrollHeight, behavior });
        }
    });
  }, []);

   const fetchAndSetMessages = useCallback(() => {
     if (!chatId || !currentUser?.uid) {
       setLoadingMessages(false);
       setErrorMessages(currentUser?.uid ? "Chat ID is missing." : "User not identified.");
       return () => {};
     }

     setLoadingMessages(true);
     setErrorMessages(null);
     console.log(`ChatWindow: Fetching messages for chat ${chatId}`);
     
     const unsubscribe = getChatMessages(
       chatId,
       (fetchedMessages) => {
         console.log(`ChatWindow: Received messages for chat ${chatId}`, fetchedMessages.length);
         const processedMessages = fetchedMessages.map((msg) => ({
           ...msg,
           isSentByCurrentUser: msg.senderId === currentUser.uid,
         }));

         const newMessagesCount = fetchedMessages.length;
         const previousMessagesCount = previousMessagesCountRef.current;

         // Play sound for new messages from other users
         if (newMessagesCount > previousMessagesCount) {
            const lastNewMessage = fetchedMessages[fetchedMessages.length - 1];
            if (lastNewMessage.senderId !== currentUser.uid) {
                playSound('/sounds/message-received.mp3');
            }
         }
         
         setMessages(processedMessages);
         
         if(loadingMessages) { // Only on initial load
            scrollToBottom('auto');
         }

         setLoadingMessages(false);

         // Mark messages as seen
         if (currentUser?.uid) {
            markMessagesAsSeen(chatId, currentUser.uid);
         }

         if (processedMessages.length > 0 && processedMessages[processedMessages.length - 1].senderId === BOT_UID) {
           setIsBotTyping(false);
         }
       },
       (error) => {
         console.error("ChatWindow: Error fetching messages:", error);
         setErrorMessages(error.message || "Failed to load messages.");
         setLoadingMessages(false);
         setIsBotTyping(false);
       }
     );
     return unsubscribe;
   }, [chatId, currentUser?.uid, playSound, scrollToBottom]);

   useEffect(() => {
     const unsubscribe = fetchAndSetMessages();
     return () => unsubscribe();
   }, [fetchAndSetMessages]);

   useEffect(() => {
    const hasNewMessages = messages.length > previousMessagesCountRef.current;

    if (hasNewMessages) {
        scrollToBottom('smooth');
    }
    
    // Update the ref *after* the check
    previousMessagesCountRef.current = messages.length;

   }, [messages, scrollToBottom]);


  const handleSendMessage = async (
    newMessageText: string, 
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number }
  ) => {
    if (!currentUser || !chatId) {
      toast({ title: "Error", description: "Could not send message. User or chat not identified.", variant: "destructive" });
      return;
    }
     if (isSending || (!newMessageText.trim() && !attachmentData)) return;

    setIsSending(true);
    console.log(`ChatWindow: Sending message to chat ${chatId}. Attachment: ${attachmentData?.name}, Reply: ${!!replyingToMessage}`);

    let replyContext: Message['replyingTo'] = null;
    if (replyingToMessage) {
        const isReplyingToAttachment = !!replyingToMessage.attachmentUrl;
        replyContext = {
            id: replyingToMessage.id!,
            senderName: replyingToMessage.senderName || 'User',
            textSnippet: isReplyingToAttachment 
                ? (replyingToMessage.attachmentName || replyingToMessage.attachmentType || 'Attachment')
                : (replyingToMessage.text ? replyingToMessage.text.substring(0, 50) + (replyingToMessage.text.length > 50 ? '...' : '') : ''),
            wasAttachment: isReplyingToAttachment,
            attachmentType: replyingToMessage.attachmentType,
            attachmentName: replyingToMessage.attachmentName,
            wasImage: replyingToMessage.attachmentType === 'image',
        };
    }


    if (chatPartnerId === BOT_UID && currentUser.uid !== BOT_UID) {
      setIsBotTyping(true);
    }
    
    try {
      await sendMessageToChat(
          chatId, 
          currentUser.uid, 
          newMessageText.trim(), 
          attachmentData,
          replyContext,
          false, // isBotMessage
          undefined, // isWittyReactionResponse
          undefined, // repliedToReactionOnMessageId
          undefined, // repliedToReactionEmoji
          songUrl // Pass the song context
      );
      setReplyingToMessage(null); 
      messageInputRef.current?.clearAttachmentPreview(); 
    } catch (error: any) {
      console.error("ChatWindow: Error sending message:", error);
      toast({ title: "Send Failed", description: error.message || "Could not send message.", variant: "destructive" });
      if (chatPartnerId === BOT_UID) {
        setIsBotTyping(false);
      }
    } finally {
        setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId) return;
    console.log(`ChatWindow: Deleting message ${messageId} from chat ${chatId}`);
    try {
        await deleteMessageFromService(chatId, messageId);
        toast({ title: "Message Deleted", description: "The message has been successfully deleted." });
    } catch (error: any) {
        console.error("ChatWindow: Error deleting message:", error);
        toast({ title: "Delete Failed", description: error.message || "Could not delete message.", variant: "destructive"});
    }
  };

  const handleReplyToMessage = (messageToReply: Message) => {
    setReplyingToMessage(messageToReply);
    messageInputRef.current?.focusInput();
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !chatId) {
        toast({ title: "Error", description: "Cannot react. User or chat not identified.", variant: "destructive" });
        return;
    }
    console.log(`ChatWindow: User ${currentUser.uid} toggled reaction ${emoji} for message ${messageId}`);
    try {
        await toggleReactionOnService(chatId, messageId, emoji, currentUser.uid);
    } catch (error: any) {
        console.error("ChatWindow: Error toggling reaction:", error);
        toast({ title: "Reaction Failed", description: error.message || "Could not update reaction.", variant: "destructive"});
    }
  };


  const fallbackInitials = chatName.substring(0, 2).toUpperCase();

  const handleHeaderAvatarClick = async () => {
    if (chatPartnerId === BOT_UID || chatAvatarUrl === 'outline-bird-avatar' || chatPartnerId === DEV_UID || chatIconIdentifier === 'dev-team-svg') {
        return;
    }
    if(partnerProfileDetails){
        setPartnerProfileDialogOpen(true);
    } else {
      console.error("Partner profile not found for:", chatPartnerId);
      toast({title: "Profile Not Found", description: "Could not load partner's profile details.", variant: "destructive"});
    }
  };

 const renderChatHeaderAvatar = () => {
    const isBotWithNewAvatar = chatAvatarUrl === 'outline-bird-avatar';
    const isDev = chatIconIdentifier === 'dev-team-svg';
    const avatarBaseClasses = "h-8 w-8 md:h-9 md:w-9 mr-2 md:mr-3 shrink-0";
    const dataAiHint = isBotWithNewAvatar ? "blue bird" : (isDev ? "team avatar" : (isCreator ? "creator avatar" : "user avatar"));


    if (isBotWithNewAvatar) {
        return (
          <Avatar className={cn(avatarBaseClasses, "border-sky-500/50")}>
            <AvatarFallback className="bg-muted">
              <OutlineBirdIcon className="text-sky-500 p-1" />
            </AvatarFallback>
          </Avatar>
        );
    } else if (isDev) {
       return (
         <div className={cn(avatarBaseClasses, "flex items-center justify-center rounded-full bg-muted text-muted-foreground")}>
           <DevTeamAvatarIcon />
         </div>
       );
    } else if (chatAvatarUrl) {
       return (
         <Avatar className={cn(avatarBaseClasses, "cursor-pointer")} onClick={handleHeaderAvatarClick}>
           <AvatarImage src={chatAvatarUrl} alt={chatName} data-ai-hint={dataAiHint}/>
           <AvatarFallback>{fallbackInitials}</AvatarFallback>
         </Avatar>
       );
     } else {
       return (
          <Avatar className={cn(avatarBaseClasses, "cursor-pointer")} onClick={handleHeaderAvatarClick}>
             <AvatarFallback>{fallbackInitials}</AvatarFallback>
          </Avatar>
       );
     }
  };

 const handleImageClick = (url: string | undefined) => {
    if(url && (url.startsWith('data:image') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i) )) {
        setImagePreviewUrl(url);
    }
 };

const handleAudioCall = () => {
    if (chatPartnerId === BOT_UID) {
        toast({ title: "Dude Are you dumb.", description: "Why you are trying to call a chatbot"});
        return;
    }
    if (chatPartnerId === DEV_UID) {
        toast({ title: "Call Not Supported", description: `Audio calls are not available for this contact.`});
        return;
    }
    setIsAudioCallDialogOpen(true);
};

const handleVideoCall = () => {
    toast({ title: "Video Call", description: "This feature is for demonstration purposes." });
};

const ColorOption = ({ colorValue, colorClass, name, onSelect }: { colorValue: string, colorClass: string, name: string, onSelect: (color: string) => void }) => (
    <DropdownMenuItem onClick={() => onSelect(colorValue)}>
      <div className={cn("w-4 h-4 rounded-full mr-2 border", colorClass)} />
      <span>{name}</span>
    </DropdownMenuItem>
);


  return (
    <>
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center p-2 md:p-3 border-b bg-secondary shrink-0">
         <Link href="/chat" className="md:hidden mr-1">
           <Button variant="ghost" size="icon" className="h-8 w-8">
             <ArrowLeft className="h-5 w-5" />
           </Button>
         </Link>
         {renderChatHeaderAvatar()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
             <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">{chatName}</p>
            {chatAvatarUrl === 'outline-bird-avatar' ? (
                <SquareBotBadgeIcon />
            ) : chatIconIdentifier === 'dev-team-svg' ? (
                <Wrench className="h-4 w-4 text-blue-600 shrink-0" />
            ) : (
                <>
                  {isCreator && <CreatorLetterCBBadgeIcon className="h-4 w-4" />}
                  {isVIP && <Crown className="h-4 w-4 text-yellow-500 shrink-0" />}
                  {isVerified && !isCreator && <VerifiedBadge className={cn("shrink-0", (isVIP || isCreator) && "ml-0.5")}/>}
                </>
            )}
          </div>
          {chatPartnerId !== BOT_UID && chatPartnerId !== DEV_UID && (
            <p className={cn(
                "text-xs text-muted-foreground truncate",
                partnerOnlineStatus === "Online" && "text-green-600 font-medium"
            )}>
                {partnerOnlineStatus}
            </p>
           )}
        </div>
        <div className="flex items-center space-x-1">
          {chatPartnerId !== BOT_UID && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAudioCall}>
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <span className="sr-only">Call</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVideoCall}>
                <Video className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <span className="sr-only">Video Call</span>
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={!hasVipAccess} onClick={ hasVipAccess ? undefined : () => toast({ title: 'VIP Feature', description: 'Purchase a VIP plan to unlock custom bubble colors.'}) }>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Change Bubble Color</span>
                        {!hasVipAccess && <Crown className="ml-auto h-4 w-4 text-yellow-500" />}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <ColorOption colorValue="sky-blue" colorClass="bg-sky-500" name="Sky Blue" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="light-green" colorClass="bg-green-500" name="Light Green" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="red" colorClass="bg-red-500" name="Red" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="orange" colorClass="bg-orange-500" name="Orange" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="yellow" colorClass="bg-yellow-400" name="Yellow" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="purple" colorClass="bg-purple-500" name="Purple" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="pink" colorClass="bg-pink-500" name="Pink" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="indigo" colorClass="bg-indigo-500" name="Indigo" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="teal" colorClass="bg-teal-500" name="Teal" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="white" colorClass="bg-white" name="White" onSelect={handleBubbleColorChange} />
                        <ColorOption colorValue="black" colorClass="bg-black" name="Black" onSelect={handleBubbleColorChange} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBubbleColorChange(null)}>
                            Reset to Default
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto">
        <ScrollArea className="absolute inset-0 p-3 md:p-4" viewportRef={scrollViewportRef}>
           {loadingMessages && (
               <div className="flex flex-col justify-center items-center h-full text-center p-4">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
               </div>
           )}
            {errorMessages && !loadingMessages && (
                <div className="flex flex-col justify-center items-center h-full text-center text-destructive p-4">
                    <ShieldAlert className="h-8 w-8 mb-2" />
                    <p className="text-sm font-medium">Error Loading Messages</p>
                    <p className="text-xs mt-1">{errorMessages}</p>
                    <Button onClick={fetchAndSetMessages} variant="outline" size="sm" className="mt-4">
                         <RefreshCw className="mr-2 h-4 w-4"/>
                         Try Again
                    </Button>
                </div>
            )}
          {!loadingMessages && !errorMessages && messages.length === 0 && (
              <div className="text-center text-muted-foreground p-4 mt-10">
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs">Start the conversation!</p>
              </div>
          )}
          {!loadingMessages && !errorMessages && messages.map((msg, index) => {
             const partnerId = chatPartnerId;
             const isLastMessage = index === messages.length - 1;
             const isSeen = isLastMessage && msg.isSentByCurrentUser && msg.seenBy?.includes(partnerId);

             return (
                <MessageBubble
                  key={msg.id || `msg-${msg.senderId}-${msg.timestamp?.seconds}-${msg.timestamp?.nanoseconds}`}
                  message={msg}
                  currentUserId={currentUser?.uid}
                  isSeen={!!isSeen}
                  onDeleteMessage={handleDeleteMessage}
                  onReplyToMessage={handleReplyToMessage}
                  onToggleReaction={handleToggleReaction}
                  onImageClick={handleImageClick}
                  customBubbleColor={customBubbleColor}
                  isTransparentMode={isTransparentMode}
                />
             )
           })}
        </ScrollArea>
      </div>

      {chatPartnerId === BOT_UID && isBotTyping && (
        <div className="px-3 md:px-4 pb-1 pt-1 text-left flex items-center gap-2 shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground italic">Blue Bird is typing...</p>
        </div>
      )}

      <div className="shrink-0">
        {amBlockedByPartner ? (
          <div className="p-4 border-t bg-secondary text-center text-sm text-destructive font-medium flex items-center justify-center gap-2">
            <Ban className="h-4 w-4" />
            <span>You have been blocked by this user.</span>
          </div>
        ) : (
          <MessageInput
            ref={messageInputRef}
            onSendMessage={handleSendMessage}
            disabled={loadingMessages || !!errorMessages || isSending}
            isSending={isSending}
            replyingTo={replyingToMessage}
            onCancelReply={cancelReply}
            customBubbleColor={customBubbleColor}
          />
        )}
      </div>
    </div>
     {partnerProfileDetails && (
        <UserProfileDialog
          isOpen={isPartnerProfileDialogOpen}
          onOpenChange={setPartnerProfileDialogOpen}
          profile={partnerProfileDetails}
        />
      )}
     {imagePreviewUrl && (
        <div 
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setImagePreviewUrl(null)}
        >
            <img 
                src={imagePreviewUrl} 
                alt="Enlarged preview" 
                className="max-w-full max-h-full object-contain cursor-pointer"
                onClick={(e) => e.stopPropagation()} 
            />
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:text-gray-300 h-10 w-10"
                onClick={() => setImagePreviewUrl(null)}
            >
                <X className="h-6 w-6" />
            </Button>
        </div>
     )}
     {partnerProfileDetails && (
        <AudioCallDialog 
            isOpen={isAudioCallDialogOpen}
            onOpenChange={setIsAudioCallDialogOpen}
            calleeProfile={partnerProfileDetails}
        />
     )}
    </>
  );
}
