// src/components/chat/audio-call-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneOff, MicOff, Volume2, Mic } from "lucide-react";
import type { UserProfile } from "@/context/auth-context";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/context/sound-context';

interface AudioCallDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  calleeProfile: UserProfile | null;
}

export function AudioCallDialog({ isOpen, onOpenChange, calleeProfile }: AudioCallDialogProps) {
    const { toast } = useToast();
    const { playSound } = useSound();
    const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Add a ref to track if permission request is in progress
    const permissionRequestInProgress = useRef(false);

    useEffect(() => {
        if (isOpen && !streamRef.current && !permissionRequestInProgress.current) {
            permissionRequestInProgress.current = true;
            setCallStatus('connecting');
            setIsMuted(false);
            setHasMicPermission(null);

            const getMicPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    setHasMicPermission(true);
                    setCallStatus('ringing');
                    playSound('/sounds/ringing.mp3', true);
                } catch (error) {
                    console.error('Error accessing microphone:', error);
                    setHasMicPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Microphone Access Denied',
                        description: 'Please enable microphone permissions in your browser settings to make calls.',
                        duration: 7000,
                    });
                    // Close dialog after a delay if permission is denied
                    setTimeout(() => onOpenChange(false), 4000);
                } finally {
                    permissionRequestInProgress.current = false;
                }
            };

            getMicPermission();

        } else if (!isOpen) {
            // Cleanup on close
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            playSound(null); // Stop any playing sound
            permissionRequestInProgress.current = false;
        }
    }, [isOpen, onOpenChange, playSound, toast]);

    const handleEndCall = () => {
        setCallStatus('ended');
        onOpenChange(false);
        toast({
            title: "Call Ended",
            description: `Your call with ${calleeProfile?.name} has ended.`,
        });
    };
    
    const handleToggleMute = () => setIsMuted(!isMuted);
    const handleVolumeUp = () => toast({ title: "Volume Increased", description: "This is a simulated action." });

    if (!calleeProfile) return null;

    const fallbackInitials = calleeProfile.name ? calleeProfile.name.substring(0, 2).toUpperCase() : '??';
    
    const statusText = {
        connecting: 'Connecting...',
        ringing: 'Ringing...',
        connected: 'Connected',
        ended: 'Call Ended'
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background/80 backdrop-blur-sm border-0 shadow-2xl flex flex-col h-[70vh] max-h-[500px]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Audio Call with {calleeProfile.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center pt-12 pb-8 gap-6 text-center flex-1">
                    <div className="relative">
                        <Avatar className={cn(
                            "h-32 w-32 border-4 shadow-lg",
                            callStatus === 'ringing' && "border-green-500/50 animate-pulse"
                        )}>
                            <AvatarImage src={calleeProfile.avatarUrl} alt={calleeProfile.name} data-ai-hint="user avatar" />
                            <AvatarFallback className="text-4xl">{fallbackInitials}</AvatarFallback>
                        </Avatar>
                    </div>
                    
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground">{calleeProfile.name}</h2>
                        <p className="text-lg text-muted-foreground animate-pulse">
                            {statusText[callStatus]}
                        </p>
                    </div>

                    {hasMicPermission === false && (
                        <Alert variant="destructive" className="max-w-sm mx-auto">
                            <MicOff className="h-4 w-4" />
                            <AlertTitle>Microphone Required</AlertTitle>
                            <AlertDescription>
                                Please allow microphone access to make calls.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex items-center justify-center gap-4 p-6 bg-secondary/50 rounded-b-lg">
                    <Button 
                        variant={isMuted ? "destructive" : "secondary"} 
                        size="lg" 
                        className="rounded-full h-14 w-14 shadow-md"
                        onClick={handleToggleMute}
                        disabled={callStatus === 'connecting'}
                    >
                        {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                        <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="lg" 
                        className="rounded-full h-16 w-16 shadow-lg"
                        onClick={handleEndCall}
                    >
                        <PhoneOff className="h-8 w-8" />
                        <span className="sr-only">End Call</span>
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="lg" 
                        className="rounded-full h-14 w-14 shadow-md"
                        onClick={handleVolumeUp}
                        disabled={callStatus === 'connecting'}
                    >
                        <Volume2 className="h-7 w-7" />
                        <span className="sr-only">Volume Up</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
