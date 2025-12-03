// src/components/chat/message-bubble.tsx
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Message, formatTimestamp } from '@/services/firestore';
import { Trash2, Smile, CornerUpLeft, FileText, CheckCheck, Play, Pause, Reply } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button, buttonVariants } from '@/components/ui/button';
import ReactPlayer from 'react-player/lazy';

interface MessageBubbleProps {
  message: Message;
  currentUserId?: string;
  isSeen?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onImageClick?: (url?: string) => void;
  customBubbleColor?: string | null;
  isTransparentMode?: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];


const AudioVisualizer = ({ isPlaying, isSentByCurrentUser, customColor }: { isPlaying: boolean; isSentByCurrentUser: boolean; customColor?: string | null; }) => {
    let barColor;
    if (customColor) {
        barColor = (customColor === 'white' || customColor === 'black') ? 'bg-black/70 dark:bg-white/70' : 'bg-white/90';
    } else {
        barColor = isSentByCurrentUser ? 'bg-primary-foreground/90' : 'bg-primary';
    }
  
  return (
    <div className="flex items-center justify-center gap-0.5 w-24 h-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-300 ease-in-out',
            barColor,
            isPlaying ? 'animate-wave' : 'h-1',
          )}
          style={{ animationDelay: isPlaying ? `${i * 100}ms` : undefined }}
        />
      ))}
       <style jsx>{`
        @keyframes wave {
          0%, 100% { height: 0.25rem; }
          50% { height: 1.5rem; }
        }
        .animate-wave {
          animation: wave 1.2s infinite;
        }
      `}</style>
    </div>
  );
};


const AudioPlayer = ({ src, duration, isSentByCurrentUser, customColor }: { src: string; duration: number, isSentByCurrentUser: boolean, customColor?: string | null }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const setAudioData = () => {
            setCurrentTime(audio.currentTime);
        };
        
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    let textColorClass, buttonBgClass;
    if (customColor) {
        textColorClass = (customColor === 'white' || customColor === 'black') ? 'text-black/70 dark:text-white/70' : 'text-white/70';
        buttonBgClass = (customColor === 'white' || customColor === 'black') ? 'bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30' : 'bg-white/20 hover:bg-white/30';
    } else {
        textColorClass = isSentByCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground';
        buttonBgClass = isSentByCurrentUser ? 'bg-primary/80 hover:bg-primary/70 text-primary-foreground' : 'bg-muted-foreground/20 hover:bg-muted-foreground/30';
    }

    return (
        <div className="flex items-center gap-2 w-48">
             <audio ref={audioRef} src={src} preload="metadata" />
             <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full shrink-0", buttonBgClass)}
                onClick={togglePlayPause}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 flex flex-col justify-center gap-1.5">
                <AudioVisualizer isPlaying={isPlaying} isSentByCurrentUser={!!isSentByCurrentUser} customColor={customColor}/>
                 <div className="flex items-center justify-between">
                    <span className={cn("text-xs", textColorClass)}>{formatTime(currentTime)}</span>
                    <span className={cn("text-xs", textColorClass)}>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};


const ActionButtons = ({
  message,
  isSentByCurrentUser,
  onDeleteClick,
  onReplyClick,
  onToggleReaction,
  disabled,
}: {
  message: Message;
  isSentByCurrentUser: boolean;
  onDeleteClick: () => void;
  onReplyClick: () => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  disabled?: boolean;
}) => {
  const [isReactionPopoverOpen, setIsReactionPopoverOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center space-x-0.5 opacity-0 group-hover/message-row:opacity-100 transition-opacity",
        isSentByCurrentUser ? "mr-1" : "ml-1"
      )}
    >
      <Popover open={isReactionPopoverOpen} onOpenChange={setIsReactionPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-accent/70 p-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsReactionPopoverOpen(true);
            }}
            aria-label="React to message"
            disabled={disabled || message.isDeleted}
          >
            <Smile className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex space-x-1">
            {QUICK_REACTIONS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-lg rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.id && !message.isDeleted && onToggleReaction) {
                    onToggleReaction(message.id, emoji);
                  }
                  setIsReactionPopoverOpen(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-accent/70 p-1"
        onClick={(e) => { e.stopPropagation(); onReplyClick(); }}
        aria-label="Reply to message"
        disabled={disabled || message.isDeleted}
      >
        <CornerUpLeft className="h-3.5 w-3.5" />
      </Button>
      {isSentByCurrentUser && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-destructive/20 text-destructive/80 hover:text-destructive p-1"
          onClick={(e) => { e.stopPropagation(); onDeleteClick(); }}
          aria-label="Delete message"
          disabled={disabled || message.isDeleted}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};


export function MessageBubble({
  message,
  currentUserId,
  isSeen,
  onDeleteMessage,
  onReplyToMessage,
  onToggleReaction,
  onImageClick,
  customBubbleColor,
  isTransparentMode
}: MessageBubbleProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Swipe to reply state
  const [dragStartX, setDragStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 50; // pixels to swipe to trigger reply

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const {
    id: messageId,
    text,
    attachmentUrl,
    attachmentName,
    attachmentType,
    audioDuration,
    timestamp,
    isSentByCurrentUser,
    replyingTo,
    reactions,
    isDeleted
  } = message;

  const handleDoubleClick = () => {
    if (messageId && onToggleReaction && !isDeleted) {
      onToggleReaction(messageId, '❤️');
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDeleted) return;
    setIsDragging(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(startX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isDeleted) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let diffX = currentX - dragStartX;

    // Constrain swipe direction
    if (isSentByCurrentUser && diffX > 0) diffX = 0; // Sent messages can only move left
    if (!isSentByCurrentUser && diffX < 0) diffX = 0; // Received messages can only move right

    // Apply some resistance
    diffX = Math.sign(diffX) * Math.pow(Math.abs(diffX), 0.7);

    setDragX(diffX);
  };

  const handleDragEnd = () => {
    if (!isDragging || isDeleted) return;

    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      if (onReplyToMessage) {
        onReplyToMessage(message);
      }
    }
    
    setIsDragging(false);
    setDragX(0);
    setDragStartX(0);
  };

  const handleDeleteClick = () => {
    if (messageId && onDeleteMessage && !isDeleted) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (messageId && onDeleteMessage) {
      onDeleteMessage(messageId);
    }
    setShowDeleteConfirm(false);
  };

  const handleReplyClick = () => {
    if (onReplyToMessage && !isDeleted) {
      onReplyToMessage(message);
    }
  };
  
  const handleEmojiClickForDisplay = (emoji: string) => {
    if (messageId && onToggleReaction && !isDeleted) {
      onToggleReaction(messageId, emoji);
    }
  };

  const formattedTimestamp = formatTimestamp(timestamp);
  
  const colorMap = {
    'sky-blue':    { solid: 'bg-sky-500',           text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-sky-500/20',    border: 'border-sky-500/50'    }},
    'red':         { solid: 'bg-red-500',           text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-red-500/20',    border: 'border-red-500/50'    }},
    'light-green': { solid: 'bg-green-500',         text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-green-500/20',  border: 'border-green-500/50'  }},
    'yellow':      { solid: 'bg-yellow-400',        text: 'text-black',           replyBg: 'bg-black/10', replySender: 'text-black/80',            transparent: { bg: 'bg-yellow-400/20', border: 'border-yellow-500/50' }},
    'orange':      { solid: 'bg-orange-500',        text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-orange-500/20', border: 'border-orange-500/50' }},
    'purple':      { solid: 'bg-purple-500',        text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-purple-500/20', border: 'border-purple-500/50' }},
    'pink':        { solid: 'bg-pink-500',          text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-pink-500/20',   border: 'border-pink-500/50'   }},
    'indigo':      { solid: 'bg-indigo-500',        text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50' }},
    'teal':        { solid: 'bg-teal-500',          text: 'text-white',           replyBg: 'bg-white/30', replySender: 'text-white/90',            transparent: { bg: 'bg-teal-500/20',   border: 'border-teal-500/50'   }},
    'white':       { solid: 'bg-white',             text: 'text-black',           replyBg: 'bg-black/10', replySender: 'text-black/80',            transparent: { bg: 'bg-white/20',      border: 'border-gray-300/50'   }},
    'black':       { solid: 'bg-black',             text: 'text-white',           replyBg: 'bg-white/20', replySender: 'text-white/90',            transparent: { bg: 'bg-black/20',      border: 'border-gray-500/50'   }},
  };
  
  let bubbleClasses = "";
  let textClasses = "";
  let replyBgClass = "";
  let replySenderColorClass = "";
  let timestampColorClass = "";

  if (isSentByCurrentUser) {
    const colorInfo = customBubbleColor ? colorMap[customBubbleColor as keyof typeof colorMap] : null;
    
    if (colorInfo) {
      if (isTransparentMode) {
        bubbleClasses = `${colorInfo.transparent.bg} border ${colorInfo.transparent.border}`;
        textClasses = 'text-black dark:text-white';
        timestampColorClass = 'text-black/70 dark:text-white/70';
        replySenderColorClass = 'text-black/80 dark:text-white/90';
        replyBgClass = 'bg-black/10 dark:bg-white/20';
      } else {
        bubbleClasses = colorInfo.solid;
        textClasses = colorInfo.text;
        replyBgClass = colorInfo.replyBg;
        replySenderColorClass = colorInfo.replySender;
        timestampColorClass = colorInfo.text.includes('text-white') ? 'text-white/70' : 'text-black/60 dark:text-white/70';
        
        // Add conditional borders for solid white/black bubbles
        if (customBubbleColor === 'white' && !isDarkMode) {
          bubbleClasses += ' border border-gray-200';
        }
        if (customBubbleColor === 'black' && isDarkMode) {
          bubbleClasses += ' border border-gray-600';
        }
      }
    } else {
      bubbleClasses = isTransparentMode ? "bg-primary/20 border border-primary/50" : "bg-[--sent-bubble-bg]";
      textClasses = isTransparentMode ? "text-foreground" : "text-[--sent-bubble-fg] dark:text-primary-foreground";
      replyBgClass = "bg-white/30 dark:bg-black/20";
      replySenderColorClass = "text-white/90 dark:text-white/90";
      timestampColorClass = isTransparentMode ? 'text-foreground/70' : 'text-primary-foreground/70 dark:text-primary-foreground/70';
    }
  } else {
    // Received bubble colors (no custom colors for these)
    bubbleClasses = isTransparentMode ? "bg-card/40 border border-border/60" : "bg-[--received-bubble-bg]";
    textClasses = "text-[--received-bubble-fg]";
    replyBgClass = "bg-muted";
    replySenderColorClass = "text-primary";
    timestampColorClass = 'text-muted-foreground';
  }


  const renderAttachment = () => {
    if (!attachmentUrl || isDeleted) return null;

    if (attachmentType === 'audio') {
        return (
            <div className="mt-1.5" data-ai-hint="audio message">
                <AudioPlayer src={attachmentUrl} duration={audioDuration || 0} isSentByCurrentUser={!!isSentByCurrentUser} customColor={customBubbleColor}/>
            </div>
        );
    }

    if (attachmentType === 'image') {
      return (
        <div 
            className="mt-1.5 max-w-xs h-auto relative cursor-pointer" 
            data-ai-hint="chat image"
            onClick={() => onImageClick?.(attachmentUrl)}
        >
          <Image
            src={attachmentUrl}
            alt={attachmentName || "Sent image"}
            width={300}
            height={200}
            className="rounded-md object-contain"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      );
    }
    if (attachmentType === 'video') {
      return (
        <div className="mt-1.5 max-w-xs rounded-md overflow-hidden" data-ai-hint="chat video">
            <ReactPlayer
              url={attachmentUrl}
              controls
              width="100%"
              height="auto"
              style={{ maxWidth: '300px' }}
            />
        </div>
      );
    }
    if (attachmentType === 'document') {
      return (
        <div className="mt-1.5">
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors",
                isSentByCurrentUser ? "hover:bg-primary/70" : "hover:bg-muted"
            )}
          >
            <FileText className={cn("h-6 w-6 shrink-0", isSentByCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground")} />
            <span className={cn("text-sm font-medium break-all", isSentByCurrentUser ? "text-primary-foreground" : "text-foreground")}>
              {attachmentName || "Document"}
            </span>
          </a>
        </div>
      );
    }
    return null;
  };
  
  const replyTextSnippet = () => {
    if (!replyingTo) return "";
    if (replyingTo.wasAttachment) {
        return replyingTo.attachmentName || replyingTo.attachmentType || "Attachment";
    }
    return replyingTo.textSnippet;
  }

  const renderedReactions = !isDeleted && reactions && Object.keys(reactions).length > 0
    ? Object.entries(reactions)
        .filter(([_, reactionData]) => reactionData.count > 0)
        .map(([emoji, _]) => emoji)
    : [];

  const dragStyle = {
    transform: `translateX(${dragX}px)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  };

  const replyIconOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);

  return (
    <>
      <div
        className={cn(
          "group/message-row flex w-full mb-4 items-center animate-in fade-in",
          isSentByCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        {isSentByCurrentUser && (
            <ActionButtons
                message={message}
                isSentByCurrentUser={!!isSentByCurrentUser}
                onDeleteClick={handleDeleteClick}
                onReplyClick={handleReplyClick}
                onToggleReaction={onToggleReaction}
                disabled={isDragging}
            />
        )}
        
        {!isSentByCurrentUser && (
            <div
                className="flex items-center justify-center transition-opacity"
                style={{ opacity: replyIconOpacity, width: `${Math.abs(dragX)}px` }}
            >
                <Reply className="h-5 w-5 text-muted-foreground" />
            </div>
        )}

        <div 
          ref={bubbleRef} 
          style={dragStyle}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
            <div
            className={cn(
                "max-w-[70vw] sm:max-w-md md:max-w-lg px-3 py-2 shadow-sm flex flex-col",
                "backdrop-blur-sm",
                isTransparentMode ? "rounded-3xl" : "rounded-xl",
                isSentByCurrentUser
                ? "rounded-br-none" 
                : "rounded-bl-none",
                bubbleClasses,
                textClasses,
            )}
            >
            {replyingTo && !isDeleted && (
                <div className={cn(
                "mb-1.5 p-1.5 rounded-md text-xs border-l-2",
                replyBgClass,
                isSentByCurrentUser ? 'border-white/50 dark:border-white/50' : 'border-primary/50'
                )}>
                <p className={cn("font-semibold text-xs", replySenderColorClass)}>
                    {replyingTo.senderName || "User"}
                </p>
                <p className="truncate text-xs">
                    {replyTextSnippet()}
                </p>
                </div>
            )}

            {isDeleted ? (
                <p className="text-sm italic">This message was deleted.</p>
            ) : (
                <>
                {text && <p className="text-sm break-words whitespace-pre-wrap">{text}</p>}
                {renderAttachment()}
                </>
            )}

            <div className="flex items-end justify-end mt-1">
                <span className={cn(
                "text-xs self-end",
                timestampColorClass
                )}>
                {formattedTimestamp}
                </span>
            </div>
            </div>

            {renderedReactions.length > 0 && (
            <div 
                className={cn(
                    "absolute -bottom-2.5 flex items-center justify-center p-0.5 rounded-full bg-background shadow-md border",
                    isSentByCurrentUser ? "left-2" : "right-2"
                )}
                onClick={() => handleEmojiClickForDisplay(renderedReactions[0])} // Allow toggling first reaction
            >
                <span className="text-xs">{renderedReactions.join('')}</span>
                {reactions && reactions[renderedReactions[0]]?.count > 1 && (
                    <span className="text-xs font-medium ml-1">{reactions[renderedReactions[0]].count}</span>
                )}
            </div>
            )}
        </div>

        {isSentByCurrentUser && (
            <div
                className="flex items-center justify-center transition-opacity"
                style={{ opacity: replyIconOpacity, width: `${Math.abs(dragX)}px` }}
            >
                <Reply className="h-5 w-5 text-muted-foreground" />
            </div>
        )}

        {!isSentByCurrentUser && (
            <ActionButtons
                message={message}
                isSentByCurrentUser={!!isSentByCurrentUser}
                onDeleteClick={handleDeleteClick}
                onReplyClick={handleReplyClick}
                onToggleReaction={onToggleReaction}
                disabled={isDragging}
            />
        )}
      </div>

      {isSeen && (
          <div className="flex justify-end pr-2 pl-12 mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Seen
              </p>
          </div>
      )}

      {showDeleteConfirm && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={confirmDelete}
                className={buttonVariants({ variant: "destructive" })}
            >
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      )}
   </>
  );
}
