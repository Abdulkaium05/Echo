
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/verified-badge';
import { cn } from '@/lib/utils';
import { Crown, Wrench, User as UserIcon, UserX, Trash2, UserCheck } from 'lucide-react';
import type { UserProfile } from '@/services/firestore';
import { OutlineBirdIcon, SquareBotBadgeIcon, CreatorLetterCBBadgeIcon } from './bot-icons';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface ChatItemProps {
  id: string;
  name: string;
  contactUserId: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  lastMessageTimestampValue: number;
  isVerified?: boolean;
  isContactVIP?: boolean;
  isDevTeam?: boolean;
  isBot?: boolean;
  isCreator?: boolean; 
  isActive?: boolean;
  href: string;
  iconIdentifier?: string;
  isLastMessageSentByCurrentUser?: boolean;
  isOnline?: boolean;
  onlineStatus?: string;
  isBlocked?: boolean;
  onBlockUser: (userId: string, userName: string) => void;
  onUnblockUser: (userId: string, userName: string) => void;
  onDeleteChat: (chatItem: ChatItemProps) => void;
  onViewProfile: (userId: string) => void; // New prop for viewing profile
}

const DevTeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const DevTeamBadge = () => (
    <Wrench className="h-3.5 w-3.5 text-blue-600 shrink-0" />
);

export function ChatItem(props: ChatItemProps) {
  const {
    id,
    name,
    contactUserId,
    avatarUrl,
    lastMessage,
    timestamp,
    isVerified,
    isContactVIP,
    isDevTeam,
    isBot,
    isCreator,
    isActive,
    href,
    isLastMessageSentByCurrentUser,
    isOnline,
    isBlocked,
    onBlockUser,
    onUnblockUser,
    onDeleteChat,
    onViewProfile,
  } = props;

  const handleAvatarClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isBot && !isDevTeam) {
      onViewProfile(contactUserId);
    }
  };

  const fallbackInitials = name.substring(0, 2).toUpperCase();
  const actualIsVerified = isVerified && !isCreator && !isDevTeam && !isBot;

  const renderAvatarOrIcon = () => {
    const avatarBaseClasses = "h-10 w-10";
    const iconWrapperClasses = `${avatarBaseClasses} flex items-center justify-center rounded-full`;
    const dataAiHint = isBot ? "blue bird" : (isDevTeam ? "team avatar" : (isCreator ? "creator avatar" : "user avatar"));

    let avatarContent;

    if (isBot && avatarUrl === 'outline-bird-avatar') {
      avatarContent = (
        <Avatar className={cn(avatarBaseClasses, "border-sky-500/50")}>
          <AvatarFallback className="bg-muted">
            <OutlineBirdIcon className="text-sky-500 p-1.5" />
          </AvatarFallback>
        </Avatar>
      );
    } else if (isDevTeam) { 
      avatarContent = (
         <div className={cn(iconWrapperClasses, "bg-muted text-muted-foreground")}>
           <DevTeamIcon />
         </div>
      );
    } else { 
      avatarContent = (
        <Avatar className={avatarBaseClasses}>
          <AvatarImage src={avatarUrl} alt={name} data-ai-hint={dataAiHint} />
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
      );
    }

    return (
        <div className="relative mr-3 shrink-0">
            { !isBot && !isDevTeam ? (
                <button onClick={handleAvatarClick} className="focus:outline-none p-0 border-none bg-transparent rounded-full" disabled={isBlocked}>
                    {avatarContent}
                </button>
            ) : (
                 avatarContent 
            )}
            {isOnline && (!isBot && !isDevTeam) && (
                 <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" title="Online" />
            )}
        </div>
    );
  };

  const displayLastMessage = isLastMessageSentByCurrentUser ? `You: ${lastMessage}` : lastMessage;

  const chatItemContent = (
    <div
      className={cn(
        "flex items-center p-2.5 hover:bg-accent/50 dark:hover:bg-sidebar-accent/50 rounded-lg transition-colors border border-transparent w-full",
        isActive && "bg-accent dark:bg-sidebar-accent border-primary/20",
        !isActive && "hover:border-border",
        isBlocked ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <div className="relative mr-3 shrink-0">
        {renderAvatarOrIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2 mb-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm font-medium text-foreground min-w-0">
              {name}
            </p>
            <div className="flex items-center shrink-0">
              {isBot && <SquareBotBadgeIcon />}
              {!isBot && isDevTeam && <DevTeamBadge />}
              {!isBot && !isDevTeam && (
                  <>
                  {isCreator && <CreatorLetterCBBadgeIcon className="h-3.5 w-3.5" />}
                  {isContactVIP && <Crown className="h-4 w-4 text-yellow-500 shrink-0" />}
                  {actualIsVerified && !isCreator && <VerifiedBadge className="shrink-0"/>}
                  </>
              )}
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
          </div>
        </div>
        <div className="flex min-w-0">
          <p className={cn(
            "w-0 flex-1 truncate text-sm",
            isLastMessageSentByCurrentUser ? "text-muted-foreground" : "font-semibold text-foreground",
            isBot && !isLastMessageSentByCurrentUser && "text-sky-500"
          )}>
            {displayLastMessage}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isBot || isDevTeam}>
        {isBlocked ? (
          <div aria-disabled="true">{chatItemContent}</div>
        ) : (
          <Link href={href} passHref legacyBehavior>
            <a className="w-full no-underline text-inherit block">{chatItemContent}</a>
          </Link>
        )}
      </ContextMenuTrigger>
      {!isBot && !isDevTeam && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onViewProfile(contactUserId)}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>View Profile</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          {isBlocked ? (
            <ContextMenuItem
              onClick={() => onUnblockUser(contactUserId, name)}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Unblock User</span>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onBlockUser(contactUserId, name)}
            >
              <UserX className="mr-2 h-4 w-4" />
              <span>Block User</span>
            </ContextMenuItem>
          )}
          <ContextMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteChat(props)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Chat</span>
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
