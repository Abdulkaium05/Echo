
// src/components/chat/message-input.tsx
'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Paperclip, Mic, X, Image as ImageIcon, FileText, Video, Square, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/services/firestore'; 
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSound } from '@/context/sound-context';

export interface MessageInputHandle {
  focusInput: () => void;
  clearAttachmentPreview: () => void;
}

interface MessageInputProps {
  onSendMessage: (
    message: string, 
    attachmentData?: { dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number }
  ) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  ({ onSendMessage, disabled = false, isSending = false, replyingTo, onCancelReply }, ref) => {
    const [message, setMessage] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState<{ dataUri: string; name: string; type: 'image' | 'video' | 'document' | 'audio' | 'other', duration?: number } | null>(null);
    const { toast } = useToast();
    const { playSound } = useSound();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const [isAttachPopoverOpen, setIsAttachPopoverOpen] = useState(false);
    
    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            textInputRef.current?.focus();
        },
        clearAttachmentPreview: () => {
            setAttachmentPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; 
            }
        }
    }));
    
     useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const handleSend = async () => {
      if (disabled || isSending || isRecording) return;
      if (!message.trim() && !attachmentPreview) return;

      playSound('/sounds/message-sent.mp3');

      const messageToSend = message.trim();
      const attachmentToSend = attachmentPreview;

      setMessage('');
      setAttachmentPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
      
      await onSendMessage(messageToSend, attachmentToSend || undefined);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || isSending || isRecording) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const triggerFileInput = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
        setIsAttachPopoverOpen(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        let fileType: 'image' | 'video' | 'document' | 'audio' | 'other' = 'other';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';
        else if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) fileType = 'document';

        if (fileType === 'other') {
             toast({ variant: 'destructive', title: 'Unsupported File Type', description: 'Please select an image, video, audio, or document.' });
             return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit for demo
          toast({ variant: 'destructive', title: 'File Too Large', description: 'File must be smaller than 10MB.' });
          return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          let duration: number | undefined = undefined;
          if (fileType === 'audio') {
              const audioContext = new AudioContext();
              const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());
              duration = audioBuffer.duration;
          }
          setAttachmentPreview({ dataUri: result, name: file.name, type: fileType, duration });
          toast({ title: "File Selected", description: `${file.name} is ready to be sent.` });
        };
        reader.onerror = () => {
          toast({ variant: 'destructive', title: 'Error Reading File', description: 'Could not read the selected file.' });
        };
        reader.readAsDataURL(file);
      }
       if(fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];

            mediaRecorderRef.current.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop()); // Stop mic access
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUri = e.target?.result as string;
                    setAttachmentPreview({
                        dataUri,
                        name: `recording-${new Date().toISOString()}.webm`,
                        type: 'audio',
                        duration: recordingTime,
                    });
                };
                reader.readAsDataURL(audioBlob);
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            playSound('/sounds/record-start.mp3');

        } catch (error) {
            console.error("Error starting recording:", error);
            toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not access microphone. Please check permissions.' });
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        setIsRecording(false);
        playSound('/sounds/record-stop.mp3');
    };
    
    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const removeAttachmentPreview = () => {
        setAttachmentPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const replyTextSnippet = () => {
        if (!replyingTo) return "";
        if (replyingTo.attachmentUrl) {
            return replyingTo.attachmentName || replyingTo.attachmentType || "Attachment";
        }
        return replyingTo.text || "Message";
    }

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="p-2 md:p-4 border-t bg-secondary flex flex-col">
        {replyingTo && (
          <div className="mb-2 p-2 pr-8 rounded-md bg-accent/50 text-xs text-accent-foreground relative">
            <div className="border-l-2 border-primary pl-2">
                <p className="font-semibold">Replying to: {replyingTo.senderName || 'User'}</p>
                <p className="truncate">
                {replyTextSnippet()}
                </p>
            </div>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={onCancelReply}
                aria-label="Cancel reply"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {attachmentPreview && !isRecording && (
          <div className="mb-2 p-2 rounded-md bg-background border border-border relative group flex items-center gap-2 max-w-xs">
            {attachmentPreview.type === 'image' && (
                <Image
                src={attachmentPreview.dataUri}
                alt={attachmentPreview.name}
                width={40}
                height={40}
                className="rounded-sm object-cover"
                data-ai-hint="selected attachment preview"
                />
            )}
            {(attachmentPreview.type === 'video' || attachmentPreview.type === 'document' || attachmentPreview.type === 'other') && (
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
            )}
            {attachmentPreview.type === 'audio' && (
                <Mic className="h-8 w-8 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachmentPreview.name}</p>
                <p className="text-xs text-muted-foreground">{attachmentPreview.type}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={removeAttachmentPreview}
              aria-label="Remove attachment"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || isSending || isRecording}
            />
            {!message.trim() && !attachmentPreview && (
                <Button variant="ghost" size="icon" className="mr-1" disabled={disabled || isSending} aria-label={isRecording ? "Stop recording" : "Start recording"} onClick={handleMicClick}>
                    {isRecording ? <Square className="h-5 w-5 text-destructive animate-pulse" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
                </Button>
            )}
            <Popover open={isAttachPopoverOpen} onOpenChange={setIsAttachPopoverOpen}>
                <PopoverTrigger asChild>
                     <Button variant="ghost" size="icon" className="mr-1" disabled={disabled || isSending || isRecording} aria-label="Attach file">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1" side="top" align="start">
                    <div className="flex flex-col gap-1">
                        <Button variant="ghost" className="justify-start px-2 py-1.5 h-auto text-sm" onClick={() => triggerFileInput('image/*,video/*')}>
                            <ImageIcon className="mr-2 h-4 w-4" /> Photo or Video
                        </Button>
                        <Button variant="ghost" className="justify-start px-2 py-1.5 h-auto text-sm" onClick={() => triggerFileInput('audio/*')}>
                            <Mic className="mr-2 h-4 w-4" /> Audio
                        </Button>
                        <Button variant="ghost" className="justify-start px-2 py-1.5 h-auto text-sm" onClick={() => triggerFileInput('.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain')}>
                            <FileText className="mr-2 h-4 w-4" /> Document
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            
            {isRecording ? (
                <div className="flex-1 mr-2 bg-background rounded-lg h-10 flex items-center px-3 justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-destructive rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-muted-foreground">{formatRecordingTime(recordingTime)}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={stopRecording}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                </div>
            ) : (
                <Input
                    ref={textInputRef}
                    type="text"
                    placeholder={disabled ? "Loading chat..." : "Type a message..."}
                    className="flex-1 mr-2 bg-background"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={disabled || isSending || !!attachmentPreview}
                    aria-disabled={disabled || isSending || !!attachmentPreview}
                    autoComplete="off"
                />
            )}
            
            <Button onClick={handleSend} size="icon" disabled={(!message.trim() && !attachmentPreview) || disabled || isSending || isRecording}>
                {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Send className="h-5 w-5" />
                )}
                <span className="sr-only">Send Message</span>
            </Button>
        </div>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";
