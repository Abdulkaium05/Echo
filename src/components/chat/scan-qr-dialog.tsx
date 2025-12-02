// src/components/chat/scan-qr-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, CheckCircle, QrCode, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, findChatBetweenUsers, createChat, redeemBadgeGiftCode } from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface ScanQrDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScanQrDialog({ isOpen, onOpenChange }: ScanQrDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'error' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const animationFrameRef = useRef<number>();
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const processQrCode = async (decodedText: string | null) => {
        if (!decodedText || isProcessing || !currentUser) return;
        
        setIsProcessing(true);
        setStatus('success');
        stopCamera();

        try {
            const data = JSON.parse(decodedText);
            
            if (data.type === 'user_profile' && data.uid) {
                await processUserProfileCode(data.uid);
            } else if (data.type === 'badge_gift' && data.code) {
                await processBadgeGiftCode(data.code);
            } else {
                throw new Error("Invalid or unsupported QR code format.");
            }
        } catch (err: any) {
            console.error("Error processing QR code:", err);
            toast({ title: 'Error', description: err.message || 'Could not process QR code.', variant: 'destructive' });
            setStatus('error');
            setErrorMessage(err.message || 'Could not process QR code.');
            setIsProcessing(false);
        }
    };

    const processUserProfileCode = async (profileUid: string) => {
        if (profileUid === currentUser?.uid) {
            toast({ title: 'Cannot Add Self', description: "You cannot add yourself from a QR code.", variant: 'destructive' });
            setIsProcessing(false);
            onOpenChange(false);
            return;
        }

        const profile = await getUserProfile(profileUid);
        if (!profile) throw new Error("User profile from QR code not found.");

        toast({ title: "User Found!", description: `Found ${profile.name}. Creating chat...`, action: <CheckCircle className="h-5 w-5 text-green-500" /> });

        let chatId = await findChatBetweenUsers(currentUser!.uid, profile.uid);
        if (!chatId) {
            chatId = await createChat(currentUser!.uid, profile.uid);
        }
        onOpenChange(false);
        router.push(`/chat/${profile.uid}`);
    };

    const processBadgeGiftCode = async (code: string) => {
        if (!currentUser) return;
        const result = await redeemBadgeGiftCode(currentUser.uid, code);
        
        toast({
            title: "Badge Redeemed!",
            description: `You've received the ${result.badgeType} badge for ${result.durationDays} days.`,
            duration: 7000
        });
        
        onOpenChange(false);
        setIsProcessing(false);
    };

    const scanFromFrame = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                if (code) {
                    processQrCode(code.data);
                }
            }
        }
        if (!isProcessing) {
            animationFrameRef.current = requestAnimationFrame(scanFromFrame);
        }
    };

    const startCamera = async () => {
        stopCamera();
        setStatus('requesting');
        setErrorMessage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.play();
                setStatus('scanning');
                animationFrameRef.current = requestAnimationFrame(scanFromFrame);
            }
        } catch (err) {
            console.error("Camera permission error:", err);
            setStatus('error');
            setErrorMessage("Camera permission denied. Please allow camera access in your browser settings.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            processQrCode(code.data);
                        } else {
                            toast({ title: 'No QR Code Found', description: 'Could not find a valid QR code in the selected image.', variant: 'destructive' });
                        }
                    }
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><QrCode/> Scan QR Code</DialogTitle>
                    <DialogDescription>
                        Point your camera at a QR code, or upload an image from your gallery.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className={cn("w-full h-full object-cover", status !== 'scanning' && 'hidden')} />
                    <canvas ref={canvasRef} className="hidden" />

                    {status === 'requesting' && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 text-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            <p className="font-semibold">Requesting Camera Access...</p>
                        </div>
                    )}
                    
                    {status === 'error' && (
                         <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-2 text-center p-4">
                            <ShieldAlert className="h-8 w-8 text-destructive"/>
                            <p className="font-semibold text-destructive">Camera Error</p>
                            <p className="text-sm text-muted-foreground">{errorMessage}</p>
                            <Button variant="outline" onClick={startCamera}>Try Again</Button>
                        </div>
                    )}

                    {status === 'success' && (
                         <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500"/>
                            <p className="font-semibold">QR Code Found!</p>
                            <p className="text-sm text-muted-foreground">Processing...</p>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[200px] h-[200px] border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                        </div>
                    )}
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                 <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload from Gallery
                </Button>
            </DialogContent>
        </Dialog>
    );
}

    
