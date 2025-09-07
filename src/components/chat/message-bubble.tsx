// src/components/chat/message-bubble.tsx
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Message, formatTimestamp } from '@/services/firestore';
import { Trash2, Smile, CornerUpLeft, FileText, CheckCheck, Play, Pause } from 'lucide-react';
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

interface MessageBubbleProps {
  message: Message;
  currentUserId?: string;
  isSeen?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onImageClick?: (url?: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];


const AudioVisualizer = ({ isPlaying, isSentByCurrentUser }: { isPlaying: boolean; isSentByCurrentUser: boolean }) => {
  const barColor = isSentByCurrentUser ? 'bg-primary-foreground/90' : 'bg-primary';
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


const AudioPlayer = ({ src, duration, isSentByCurrentUser }: { src: string; duration: number, isSentByCurrentUser: boolean }) => {
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

    return (
        <div className="flex items-center gap-2 w-48">
             <audio ref={audioRef} src={src} preload="metadata" />
             <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-8 w-8 rounded-full shrink-0",
                    isSentByCurrentUser ? "bg-primary/80 hover:bg-primary/70 text-primary-foreground" : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
                )}
                onClick={togglePlayPause}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 flex flex-col justify-center gap-1.5">
                <AudioVisualizer isPlaying={isPlaying} isSentByCurrentUser={!!isSentByCurrentUser} />
                 <div className="flex items-center justify-between">
                    <span className={cn("text-xs", isSentByCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatTime(currentTime)}</span>
                    <span className={cn("text-xs", isSentByCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatTime(duration)}</span>
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
}: MessageBubbleProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const renderAttachment = () => {
    if (!attachmentUrl || isDeleted) return null;

    if (attachmentType === 'audio') {
        return (
            <div className="mt-1.5" data-ai-hint="audio message">
                <AudioPlayer src={attachmentUrl} duration={audioDuration || 0} isSentByCurrentUser={!!isSentByCurrentUser}/>
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
      // Basic video display, could be enhanced with a player
      return (
        <div className="mt-1.5 text-sm">
            <a 
                href={attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 underline hover:text-primary/80"
            >
                <FileText className="h-4 w-4 shrink-0" />
                <span>{attachmentName || "Video"} (Tap to view)</span>
            </a>
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

  return (
    <>
    <div
      className={cn(
        "group/message-row flex w-full mb-1 items-end animate-in fade-in", 
        isSentByCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {isSentByCurrentUser && !isDeleted && (
         <ActionButtons
            message={message}
            isSentByCurrentUser={true}
            onDeleteClick={handleDeleteClick}
            onReplyClick={handleReplyClick}
            onToggleReaction={onToggleReaction}
            disabled={!!isDeleted}
        />
      )}
      
      <div className="relative">
        <div
          className={cn(
            "max-w-[70vw] sm:max-w-md md:max-w-lg px-3 py-2 shadow-sm flex flex-col",
            "backdrop-blur-sm",
            "rounded-[var(--bubble-radius)]",
            isSentByCurrentUser
              ? "bg-[--sent-bubble-bg] text-[--sent-bubble-fg] border border-[--sent-bubble-border] rounded-br-none" 
              : "bg-[--received-bubble-bg] text-[--received-bubble-fg] border border-[--received-bubble-border] rounded-bl-none"
          )}
        >
          {replyingTo && !isDeleted && (
            <div className={cn(
              "mb-1.5 p-1.5 rounded-md text-xs border-l-2",
              isSentByCurrentUser ? "bg-primary/60 border-primary-foreground/50" : "bg-muted border-primary/50"
            )}>
              <p className={cn(
                "font-semibold text-xs",
                 isSentByCurrentUser ? "text-primary-foreground/90" : "text-primary"
              )}>{replyingTo.senderName || "User"}</p>
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
              isSentByCurrentUser ? "text-[--sent-bubble-fg]/70" : "text-muted-foreground"
            )}>
              {formattedTimestamp}
            </span>
          </div>
        </div>

        {renderedReactions.length > 0 && (
          <div 
              className={cn(
                  "absolute -bottom-2.5 flex items-center justify-center p-0.5 rounded-full bg-background shadow-md border",
                  isSentByCurrentUser ? "right-2" : "right-2"
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

      {!isSentByCurrentUser && !isDeleted && (
         <ActionButtons
            message={message}
            isSentByCurrentUser={false}
            onDeleteClick={handleDeleteClick} 
            onReplyClick={handleReplyClick}
            onToggleReaction={onToggleReaction}
            disabled={!!isDeleted}
        />
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
    </div>
    {isSeen && (
        <div className="flex justify-end pr-2 pl-12 mb-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCheck className="h-3.5 w-3.5" />
                Seen
            </p>
        </div>
    )}
   </>
  );
}
