
// src/components/chat/chat-window.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { MessageInput, type MessageInputHandle } from './message-input';
import { VerifiedBadge } from '@/components/verified-badge';
import { ArrowLeft, Phone, Video, Loader2, ShieldAlert, RefreshCw, Wrench, Crown, MoreVertical, Palette, X, Ban, Trash2, UserX, UserCheck, Leaf, SmilePlus, FlaskConical, Bot, Rocket, Gem } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
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
    formatLastSeen,
    markMessagesAsSeen,
} from '@/services/firestore';
import { blueBirdAssistant, type BlueBirdAssistantInput, type BlueBirdAssistantOutput } from '@/ai/flows/blueBirdAiFlow';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { UserProfileDialog } from '@/components/profile/user-profile-dialog';
import { cn } from "@/lib/utils";
import { OutlineBirdIcon, SquareBotBadgeIcon, CreatorLetterCBBadgeIcon } from './bot-icons'; // Changed import
import { useMusicPlayer, type SavedSong } from '@/context/music-player-context';
import { AudioCallDialog } from './audio-call-dialog'; // Import the new component
import { useSound } from '@/context/sound-context';
import { useVIP } from '@/context/vip-context';
import { useBlockUser } from '@/context/block-user-context';
import { useTrash } from '@/context/trash-context';
import { useRouter } from 'next/navigation';
import type { BadgeType } from '@/app/(app)/layout';

const BadgeComponents: Record<BadgeType, React.FC<{className?: string}>> = {
    creator: ({className}) => <CreatorLetterCBBadgeIcon className={cn("h-4 w-4", className)} />,
    vip: ({className}) => <Crown className={cn("h-4 w-4 text-yellow-500", className)} />,
    verified: ({className}) => <VerifiedBadge className={cn("h-4 w-4", className)} />,
    dev: ({className}) => <Wrench className={cn("h-4 w-4 text-blue-600", className)} />,
    bot: ({className}) => <SquareBotBadgeIcon className={cn("h-4 w-4", className)} />,
    meme_creator: ({className}) => <SmilePlus className={cn("h-4 w-4 text-green-500", className)} />,
    beta_tester: ({className}) => <FlaskConical className={cn("h-4 w-4 text-orange-500", className)} />,
    pioneer: (props) => <Rocket {...props} />,
    patron: (props) => <Gem {...props} />,
    feature_suggestion_approved: (props) => <Gem {...props} />,
};


interface ChatWindowProps {
  chatId: string;
  chatPartnerId: string;
  chatName: string;
  chatAvatarUrl?: string;
  chatIconIdentifier?: string;
  isVerified?: boolean; // General verified status
  isVIP?: boolean;
  isCreator?: boolean;
  isDevTeam?: boolean;
}

type AIPersona = 'blue-bird' | 'green-leaf' | 'echo-bot';

export function ChatWindow({ chatId, chatPartnerId, chatName: initialChatName, chatAvatarUrl, chatIconIdentifier, isVerified, isVIP, isCreator, isDevTeam }: ChatWindowProps) {
  const { user: currentUser, userProfile, updateUserProfile } = useAuth();
  const { hasVipAccess } = useVIP();
  const { toast } = useToast();
  const router = useRouter();
  const { url: songUrl, savedSongs, setUrl: setMusicUrl } = useMusicPlayer();
  const { playSound } = useSound();
  const { addBlockedUser, unblockUser, isUserBlocked } = useBlockUser();
  const { trashChat } = useTrash();

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
  const [aiPersona, setAiPersona] = useState<AIPersona>('blue-bird');
  
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; type: 'block' | 'delete' | null }>({ isOpen: false, type: null });

  const customBubbleColor = userProfile?.chatColorPreferences?.[chatId];
  const amBlockedByPartner = partnerProfileDetails?.blockedUsers?.includes(currentUser?.uid ?? '') ?? false;
  const iHaveBlockedPartner = isUserBlocked(chatPartnerId);
  
  const isChattingWithBot = chatPartnerId === BOT_UID;
  let chatName = initialChatName;
    if (isChattingWithBot) {
        if (aiPersona === 'green-leaf') chatName = 'Green Leaf';
        else if (aiPersona === 'echo-bot') chatName = 'Echo Bot';
        else chatName = 'Blue Bird (AI Assistant)';
    }

  useEffect(() => {
    // This effect ensures the component re-renders when transparent mode or theme is toggled globally.
    if (typeof window === 'undefined') return;

    const checkGlobalClasses = () => {
        const isTransparent = document.documentElement.classList.contains('transparent-mode');
        setIsTransparentMode(isTransparent);
        
        const savedPersona = localStorage.getItem('ai_persona') as AIPersona | null;
        setAiPersona(savedPersona || 'blue-bird');
    };
    checkGlobalClasses();

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                checkGlobalClasses();
            }
        }
    });

    observer.observe(document.documentElement, { attributes: true });

    // Also listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'transparent_mode' || event.key === 'ai_persona') {
            checkGlobalClasses();
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
        observer.disconnect();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAiPersonaChange = (newPersona: AIPersona) => {
    setAiPersona(newPersona);
    localStorage.setItem('ai_persona', newPersona);
    let personaName = 'Blue Bird';
    if (newPersona === 'green-leaf') personaName = 'Green Leaf';
    if (newPersona === 'echo-bot') personaName = 'Echo Bot';
    
    toast({
        title: "AI Persona Changed",
        description: `You are now chatting with ${personaName}.`,
    });
  };

  const handleBubbleColorChange = (color: string | null) => {
    if (!currentUser || !userProfile) {
        toast({ title: "Error", description: "You must be logged in to change settings.", variant: "destructive" });
        return;
    }

    const newPreferences = { ...userProfile.chatColorPreferences, [chatId]: color };
    updateUserProfile({ chatColorPreferences: newPreferences });
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

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);

   const fetchAndSetMessages = useCallback(() => {
     if (!chatId || !currentUser?.uid) {
       setLoadingMessages(false);
       setErrorMessages(currentUser?.uid ? "Chat ID is missing." : "User not identified.");
       return () => {};
     }

     setLoadingMessages(true);
     setErrorMessages(null);
     console.log(`ChatWindow: Subscribing to messages for chat ${chatId}`);
     
     const unsubscribe = getChatMessages(
       chatId,
       (fetchedMessages) => {
         setLoadingMessages(false); // Stop loading as soon as we get a response (even an empty one)
         console.log(`ChatWindow: Received messages for chat ${chatId}`, fetchedMessages.length);
         const processedMessages = fetchedMessages.map((msg) => ({
           ...msg,
           isSentByCurrentUser: msg.senderId === currentUser.uid,
         }));
         
         setMessages(processedMessages);
         
         // Mark messages as seen
         if (currentUser?.uid) {
            markMessagesAsSeen(chatId, currentUser.uid);
         }

         if (processedMessages.length > 0 && processedMessages[processedMessages.length - 1].senderId === BOT_UID) {
           setIsBotTyping(false);
         }
         scrollToBottom();
       },
       (error) => {
         console.error("ChatWindow: Error fetching messages:", error);
         setErrorMessages(error.message || "Failed to load messages.");
         setLoadingMessages(false);
         setIsBotTyping(false);
       }
     );
     return unsubscribe;
   }, [chatId, currentUser?.uid, scrollToBottom]);

   useEffect(() => {
     const unsubscribe = fetchAndSetMessages();
     return () => { if (unsubscribe) unsubscribe()};
   }, [fetchAndSetMessages, chatId]);

  useEffect(() => {
    if (!loadingMessages) {
        scrollToBottom();
    }
  }, [loadingMessages, scrollToBottom]);

  const handleSendMessage = async (
    newMessageText: string, 
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number }
  ) => {
    if (!currentUser || !chatId || !userProfile) {
      toast({ title: "Error", description: "Could not send message. User or chat not identified.", variant: "destructive" });
      return;
    }
     if (isSending || (!newMessageText.trim() && !attachmentData)) return;

    setIsSending(true);
    console.log(`ChatWindow: Sending message to chat ${chatId}. Attachment: ${attachmentData?.name}, Reply: ${!!replyingToMessage}`);
    
    const textToSend = newMessageText.trim();

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

    try {
      await sendMessageToChat(chatId, currentUser.uid, textToSend, attachmentData, replyContext);
      setReplyingToMessage(null); 
      messageInputRef.current?.clearAttachmentPreview(); 
      playSound('/sounds/message-sent.mp3');

      // Bot interaction logic
      if (isChattingWithBot) {
        setIsBotTyping(true);

        const historyForFlow = messages
          .slice(-6)
          .map(msg => ({
            role: msg.senderId === BOT_UID ? 'model' : 'user',
            text: msg.text || `[Attachment: ${msg.attachmentName || msg.attachmentType}]`,
          }));
        
        let photoDataUri: string | undefined;
        let audioDataUri: string | undefined;
        if (attachmentData?.type === 'image') photoDataUri = attachmentData.dataUri;
        if (attachmentData?.type === 'audio') audioDataUri = attachmentData.dataUri;

        const aiInput: BlueBirdAssistantInput = {
          userName: userProfile.name,
          userMessage: textToSend || `[User sent an ${attachmentData?.type}]`,
          aiPersona: aiPersona,
          chatHistory: historyForFlow,
          photoDataUri,
          audioDataUri,
          currentlyPlayingSong: songUrl,
          savedSongs: savedSongs as SavedSong[],
        };

        console.log("[ChatWindow] Calling Genkit flow with input:", aiInput);
        const aiResponse: BlueBirdAssistantOutput = await blueBirdAssistant(aiInput);
        console.log("[ChatWindow] Received Genkit response:", aiResponse);

        if (aiResponse.songToPlay?.url) {
          setMusicUrl(aiResponse.songToPlay.url);
          toast({ title: 'Now Playing', description: `Started playing "${aiResponse.songToPlay.name}"` });
        }
        
        let botAttachment: { dataUri: string; name: string; type: 'image'; } | undefined;
        if (aiResponse.generatedImageUrl) {
            botAttachment = {
                dataUri: aiResponse.generatedImageUrl,
                name: 'generated-image.png',
                type: 'image',
            };
        }
        
        // Let the service handle message creation
        await sendMessageToChat(chatId, BOT_UID, aiResponse.botResponse, botAttachment, undefined, true);
        setIsBotTyping(false);
      }
    } catch (error: any) {
      console.error("ChatWindow: Error sending message or getting AI response:", error);
      toast({ title: "Send Failed", description: error.message || "Could not send message.", variant: "destructive" });
      if (isChattingWithBot) setIsBotTyping(false);
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
    if (chatPartnerId === BOT_UID || chatAvatarUrl === 'outline-bird-avatar') {
        return;
    }
    if(partnerProfileDetails){
        setPartnerProfileDialogOpen(true);
    } else {
      console.error("Partner profile not found for:", chatPartnerId);
      toast({title: "Profile Not Found", description: "Could not load partner's profile details.", variant: "destructive"});
    }
  };

  const handleBlockUser = () => {
    if (chatPartnerId === BOT_UID) {
      toast({ title: "Action Not Allowed", description: "This contact cannot be blocked." });
      return;
    }
    setDialogState({ isOpen: true, type: 'block' });
  };
  
  const handleUnblockUser = () => {
      unblockUser(chatPartnerId);
      toast({
          title: `Unblocked ${chatName}`,
          description: "You can now send and receive messages again.",
      });
  };

  const handleDeleteChat = () => {
    setDialogState({ isOpen: true, type: 'delete' });
  };

  const confirmBlockUser = () => {
    addBlockedUser(chatPartnerId);
    toast({
      title: `User Blocked`,
      description: `You have blocked ${chatName}. You can unblock them from the chat list context menu.`,
      variant: "destructive"
    });
    setDialogState({ isOpen: false, type: null });
  };

  const confirmDeleteChat = () => {
    trashChat({ id: chatId, name: chatName, avatarUrl, contactUserId: chatPartnerId } as any);
    toast({
      title: `Chat with ${chatName} moved to Trash`,
      description: "You can restore it from Settings.",
      variant: "destructive"
    });
    setDialogState({ isOpen: false, type: null });
    router.push('/chat');
  };

 const renderChatHeaderAvatar = () => {
    const isBot = chatPartnerId === BOT_UID;
    const avatarBaseClasses = "h-8 w-8 md:h-9 md:w-9 mr-2 md:mr-3 shrink-0";
    const dataAiHint = isBot ? "ai bot" : (isCreator ? "creator avatar" : "user avatar");

    if (isBot) {
      if (aiPersona === 'green-leaf') {
        return (
          <Avatar className={cn(avatarBaseClasses, "border-green-500/50")}>
            <AvatarFallback className="bg-green-100 dark:bg-green-900/50">
              <Leaf className="text-green-600 dark:text-green-400 p-1" />
            </AvatarFallback>
          </Avatar>
        );
      }
       if (aiPersona === 'echo-bot') {
        return (
          <Avatar className={cn(avatarBaseClasses, "border-gray-500/50")}>
            <AvatarFallback className="bg-muted">
              <Bot className="text-foreground/70 p-1" />
            </AvatarFallback>
          </Avatar>
        );
      }
      return (
        <Avatar className={cn(avatarBaseClasses, "border-sky-500/50")}>
          <AvatarFallback className="bg-muted">
            <OutlineBirdIcon className="text-sky-500 p-1" />
          </AvatarFallback>
        </Avatar>
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
        toast({ title: "Cannot Call AI", description: "Audio and video calls are not available for AI assistants."});
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

const orderedBadges = useMemo(() => {
    if (!partnerProfileDetails) return [];
    
    const earnedBadges: BadgeType[] = [];
    if(partnerProfileDetails.isCreator) earnedBadges.push('creator');
    if(partnerProfileDetails.isVIP) earnedBadges.push('vip');
    if(partnerProfileDetails.isVerified) earnedBadges.push('verified');
    if(partnerProfileDetails.isDevTeam) earnedBadges.push('dev');
    if(partnerProfileDetails.isBot) earnedBadges.push('bot');
    if(partnerProfileDetails.isMemeCreator) earnedBadges.push('meme_creator');
    if(partnerProfileDetails.isBetaTester) earnedBadges.push('beta_tester');
    if (partnerProfileDetails.isPioneer) earnedBadges.push('pioneer');
    if (partnerProfileDetails.isPatron) earnedBadges.push('patron');


    const badgeDisplayOrder = partnerProfileDetails.badgeOrder?.length ? partnerProfileDetails.badgeOrder : ['creator', 'vip', 'verified', 'dev', 'bot', 'meme_creator', 'beta_tester', 'pioneer', 'patron'];
    return badgeDisplayOrder.filter(badge => earnedBadges.includes(badge)).slice(0, 2);
}, [partnerProfileDetails]);


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
            {isChattingWithBot ? (
              <>
                {aiPersona === 'green-leaf' && <Leaf className="h-4 w-4 text-green-500" />}
                {aiPersona === 'blue-bird' && <SquareBotBadgeIcon />}
                {aiPersona === 'echo-bot' && <Bot className="h-4 w-4 text-foreground/70" />}
              </>
            ) : (
                <>
                  {orderedBadges.map(badgeKey => {
                      const BadgeComponent = BadgeComponents[badgeKey];
                      return BadgeComponent ? <BadgeComponent key={badgeKey} /> : null;
                  })}
                </>
            )}
          </div>
          {chatPartnerId !== BOT_UID && (
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
                {isChattingWithBot && (
                    <>
                        <DropdownMenuLabel>AI Persona</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={aiPersona} onValueChange={(v) => handleAiPersonaChange(v as AIPersona)}>
                            <DropdownMenuRadioItem value="blue-bird">
                                <OutlineBirdIcon className="mr-2 h-4 w-4 text-sky-500"/>
                                Blue Bird
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="green-leaf">
                                <Leaf className="mr-2 h-4 w-4 text-green-500"/>
                                Green Leaf
                            </DropdownMenuRadioItem>
                             <DropdownMenuRadioItem value="echo-bot">
                                <Bot className="mr-2 h-4 w-4 text-foreground/70"/>
                                Echo Bot
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                    </>
                )}
                
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={!hasVipAccess} onClick={ hasVipAccess ? undefined : () => toast({ title: 'VIP Feature', description: 'Purchase a VIP plan to unlock custom bubble colors.'}) }>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Bubble Color</span>
                        {!hasVipAccess && <Crown className="ml-auto h-4 w-4 text-yellow-500" />}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleBubbleColorChange(null)}>
                            Reset to Default
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
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
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />

                {iHaveBlockedPartner ? (
                    <DropdownMenuItem onClick={handleUnblockUser}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Unblock User</span>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={handleBlockUser} className="text-destructive focus:text-destructive">
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Block User</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDeleteChat} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Conversation</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
        </div>
      </div>

      <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
        <div className="p-4">
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
          {!loadingMessages && !errorMessages && (
            <div className="flex flex-col-reverse gap-2">
              {messages.slice().reverse().map((msg, index) => {
                 const partnerId = chatPartnerId;
                 const isLastMessage = index === 0;
                 const isSentByCurrentUser = msg.senderId === currentUser?.uid;
                 const isSeen = isLastMessage && isSentByCurrentUser && msg.seenBy?.includes(partnerId);

                 return (
                    <MessageBubble
                      key={msg.id || `msg-${msg.senderId}-${msg.timestamp?.seconds}-${msg.timestamp?.nanoseconds}`}
                      message={{...msg, isSentByCurrentUser: isSentByCurrentUser}}
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
             </div>
          )}
        </div>
      </ScrollArea>

      {isChattingWithBot && isBotTyping && (
        <div className="px-3 md:px-4 pb-1 pt-1 text-left flex items-center gap-2 shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground italic">{chatName} is typing...</p>
        </div>
      )}

      <div className="shrink-0">
        {iHaveBlockedPartner ? (
          <div className="p-4 border-t bg-secondary text-center text-sm font-medium flex items-center justify-center gap-2">
            <Ban className="h-4 w-4 text-destructive" />
            <span className="text-destructive">You have blocked this user.</span>
            <Button variant="outline" size="sm" onClick={handleUnblockUser}>
              <UserCheck className="mr-2 h-4 w-4"/>
              Unblock
            </Button>
          </div>
        ) : amBlockedByPartner ? (
          <div className="p-4 border-t bg-secondary text-center text-sm text-destructive font-medium flex items-center justify-center gap-2">
            <Ban className="h-4 w-4" />
            <span>You cannot reply to this conversation.</span>
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

     <AlertDialog open={dialogState.isOpen} onOpenChange={() => setDialogState({ isOpen: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.type === 'block' ? `Block ${chatName}?` :
               `Delete chat with ${chatName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'block'
                ? "You will not be able to send or receive messages from this user until you unblock them."
                : "This will move the chat to the Trash. You can restore it from Settings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (dialogState.type === 'block') {
                  confirmBlockUser();
                } else if (dialogState.type === 'delete') {
                  confirmDeleteChat();
                }
              }}
            >
              {dialogState.type === 'block' ? 'Block' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
