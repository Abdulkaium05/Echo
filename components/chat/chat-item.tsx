
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/verified-badge';
import { cn } from '@/lib/utils';
import { Crown, Wrench, User as UserIcon, UserX, Trash2, UserCheck, SmilePlus, FlaskConical, Leaf, Bot } from 'lucide-react';
import type { UserProfile } from '@/services/firestore';
import { OutlineBirdIcon, SquareBotBadgeIcon, CreatorLetterCBBadgeIcon, PioneerBadgeIcon, PatronBadgeIcon, CreatorLv2BadgeIcon, MemeCreatorLv2BadgeIcon, BetaTesterLv2BadgeIcon } from './bot-icons';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { BadgeType } from '@/app/(app)/layout';


export interface ChatItemProps {
  id: string;
  name: string;
  contactUserId: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  lastMessageTimestampValue: number;
  isVerified?: boolean;
  verifiedBadgeColor?: string | null;
  isContactVIP?: boolean;
  isDevTeam?: boolean;
  isBot?: boolean;
  isCreator?: boolean;
  isMemeCreator?: boolean;
  isBetaTester?: boolean;
  isPioneer?: boolean;
  isPatron?: boolean;
  isCreatorLv2?: boolean;
  isMemeCreatorLv2?: boolean;
  isBetaTesterLv2?: boolean;
  badgeOrder?: BadgeType[];
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


const BadgeComponents: Record<string, React.FC<{className?: string, style?: React.CSSProperties}>> = {
    creator: ({className, style}) => <CreatorLetterCBBadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    vip: ({className, style}) => <Crown className={cn("h-4 w-4 text-yellow-500", className)} style={style} />,
    verified: ({className, style}) => <VerifiedBadge className={cn("h-4 w-4", className)} style={style} />,
    dev: ({className, style}) => <Wrench className={cn("h-4 w-4 text-blue-600", className)} style={style} />,
    bot: ({className, style}) => <SquareBotBadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    meme_creator: ({className, style}) => <SmilePlus className={cn("h-4 w-4 text-green-500", className)} style={style} />,
    beta_tester: ({className, style}) => <FlaskConical className={cn("h-4 w-4 text-orange-500", className)} style={style} />,
    pioneer: ({className, style}) => <PioneerBadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    patron: ({className, style}) => <PatronBadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    creator_lv2: ({className, style}) => <CreatorLv2BadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    meme_creator_lv2: ({className, style}) => <MemeCreatorLv2BadgeIcon className={cn("h-4 w-4", className)} style={style} />,
    beta_tester_lv2: ({className, style}) => <BetaTesterLv2BadgeIcon className={cn("h-4 w-4", className)} style={style} />,
};


export function ChatItem(props: ChatItemProps) {
  const {
    id,
    name,
    contactUserId,
    avatarUrl,
    lastMessage,
    timestamp,
    isVerified,
    verifiedBadgeColor,
    isContactVIP,
    isDevTeam,
    isBot,
    isCreator,
    isMemeCreator,
    isBetaTester,
    isPioneer,
    isPatron,
    isCreatorLv2,
    isMemeCreatorLv2,
    isBetaTesterLv2,
    badgeOrder,
    isActive,
    href,
    iconIdentifier,
    isLastMessageSentByCurrentUser,
    isOnline,
    isBlocked,
    onBlockUser,
    onUnblockUser,
    onDeleteChat,
    onViewProfile,
  } = props;

  const handleContextProfileView = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (!isBot && !isDevTeam && !isBlocked) {
      onViewProfile(contactUserId);
    }
  };

  const fallbackInitials = name.substring(0, 2).toUpperCase();

  const earnedBadges: BadgeType[] = [];
  if(isCreatorLv2) earnedBadges.push('creator_lv2');
  else if(isCreator) earnedBadges.push('creator');
  if(isContactVIP) earnedBadges.push('vip');
  if(isPatron) earnedBadges.push('patron');
  else if(isVerified) earnedBadges.push('verified');
  if(isPioneer) earnedBadges.push('pioneer');
  else if(isDevTeam) earnedBadges.push('dev');
  if(isBot) earnedBadges.push('bot');
  if(isMemeCreatorLv2) earnedBadges.push('meme_creator_lv2');
  else if(isMemeCreator) earnedBadges.push('meme_creator');
  if(isBetaTesterLv2) earnedBadges.push('beta_tester_lv2');
  else if(isBetaTester) earnedBadges.push('beta_tester');

  const badgeDisplayOrder = badgeOrder?.length ? badgeOrder : ['pioneer', 'patron', 'creator_lv2', 'creator', 'dev', 'verified', 'vip', 'bot', 'meme_creator_lv2', 'meme_creator', 'beta_tester_lv2', 'beta_tester'];
  const orderedBadges = badgeDisplayOrder.filter(badge => earnedBadges.includes(badge)).slice(0, 2);


  const renderAvatarOrIcon = () => {
    const avatarBaseClasses = "h-10 w-10";
    const iconWrapperClasses = `${avatarBaseClasses} flex items-center justify-center rounded-full`;
    const dataAiHint = isBot ? "ai bot" : (isDevTeam ? "team avatar" : (isCreator ? "creator avatar" : "user avatar"));

    if (iconIdentifier === 'outline-bird-avatar') {
      return (
        <Avatar className={cn(avatarBaseClasses, "border-[hsl(var(--bot-accent-color))]")}>
          <AvatarFallback className="bg-muted">
            <OutlineBirdIcon className="text-[hsl(var(--bot-accent-color))] p-1.5" />
          </AvatarFallback>
        </Avatar>
      );
    } 

    if (iconIdentifier === 'green-leaf-icon') {
        return (
            <Avatar className={cn(avatarBaseClasses, "border-[hsl(var(--bot-accent-color))]")}>
                <AvatarFallback className="bg-green-100 dark:bg-green-900/50">
                    <Leaf className="text-green-600 dark:text-green-400 p-1" />
                </AvatarFallback>
            </Avatar>
        );
    }

    if (iconIdentifier === 'echo-bot-icon') {
        return (
            <Avatar className={cn(avatarBaseClasses, "border-gray-500/50")}>
                <AvatarFallback className="bg-muted">
                    <Bot className="text-foreground/70 p-1" />
                </AvatarFallback>
            </Avatar>
        );
    }
    
    // Check for a real avatar URL first, even for Dev Team members.
    // Fallback to the icon only if there is no avatarUrl.
    if (avatarUrl && avatarUrl !== 'dev-team-svg-placeholder') {
        return (
          <Avatar className={avatarBaseClasses}>
            <AvatarImage src={avatarUrl} alt={name} data-ai-hint={dataAiHint} />
            <AvatarFallback>{fallbackInitials}</AvatarFallback>
          </Avatar>
        );
    }
    
    if (isDevTeam || iconIdentifier === 'dev-team-svg') { 
      return (
         <div className={cn(iconWrapperClasses, "bg-muted text-muted-foreground")}>
           <Wrench />
         </div>
      );
    } 
    
    return (
      <Avatar className={avatarBaseClasses}>
        <AvatarImage src={avatarUrl} alt={name} data-ai-hint={dataAiHint} />
        <AvatarFallback>{fallbackInitials}</AvatarFallback>
      </Avatar>
    );
  };

  const displayLastMessage = isLastMessageSentByCurrentUser ? `You: ${lastMessage}` : lastMessage;

  const chatItemContent = (
    <div
      className={cn(
        "flex items-center p-2.5 hover:bg-accent/50 dark:hover:bg-sidebar-accent/50 rounded-lg transition-colors border border-transparent w-full",
        isActive && "bg-accent dark:bg-sidebar-accent border-primary/20",
        isActive && isBot && "border-[hsl(var(--bot-accent-color))]",
        !isActive && "hover:border-border",
        isBlocked ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <div className="relative mr-3 shrink-0">
        {renderAvatarOrIcon()}
         {isOnline && (!isBot && !isDevTeam) && (
             <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" title="Online" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2 mb-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm font-medium text-foreground min-w-0">
              {name}
            </p>
            <div className="flex items-center shrink-0 gap-1">
              {orderedBadges.map(badgeKey => {
                  const BadgeComponent = BadgeComponents[badgeKey];
                  const style = (badgeKey === 'verified' && verifiedBadgeColor) ? { color: `hsl(var(--badge-${verifiedBadgeColor}))` } : {};
                  return BadgeComponent ? <BadgeComponent key={badgeKey} className="shrink-0" style={style} /> : null;
              })}
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
            isBot && !isLastMessageSentByCurrentUser && "text-[hsl(var(--bot-accent-color))]"
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
        <Link href={href} className="w-full no-underline text-inherit block" aria-disabled={isBlocked}>
          {chatItemContent}
        </Link>
      </ContextMenuTrigger>
      {!isBot && !isDevTeam && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={(e) => handleContextProfileView(e as unknown as React.MouseEvent)}>
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
