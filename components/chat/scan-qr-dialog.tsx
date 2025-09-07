// src/components/chat/scan-qr-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, VideoOff, ShieldAlert, CheckCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, findChatBetweenUsers, createChat } from '@/services/firestore';
import { useAuth } from '@/hooks/use-auth';

interface ScanQrDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const QR_REGION_SIZE = 250;

export function ScanQrDialog({ isOpen, onOpenChange }: ScanQrDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    
    useEffect(() => {
        if (!isOpen) return;

        let html5QrcodeScanner: Html5QrcodeScanner | null = null;
        
        // Reset states on open
        setScanResult(null);
        setError(null);
        setIsProcessing(false);
        setHasPermission(null);

        const onScanSuccess = async (decodedText: string) => {
            if (isProcessing || !currentUser) return;
            setIsProcessing(true);
            
            try {
                const data = JSON.parse(decodedText);
                if (data.type !== 'user_profile' || !data.uid) {
                    throw new Error("Invalid QR code format.");
                }

                if (data.uid === currentUser.uid) {
                    toast({ title: 'Cannot Add Self', description: "You cannot add yourself from a QR code.", variant: 'destructive' });
                    setIsProcessing(false);
                    return;
                }

                setScanResult(`Found user: ${data.uid}`);
                
                const profile = await getUserProfile(data.uid);
                if (!profile) {
                    throw new Error("User profile from QR code not found.");
                }

                toast({
                    title: "User Found!",
                    description: `Found ${profile.name}. Creating chat...`,
                    action: <CheckCircle className="h-5 w-5 text-green-500" />
                });

                let chatId = await findChatBetweenUsers(currentUser.uid, profile.uid);
                if (!chatId) {
                    chatId = await createChat(currentUser.uid, profile.uid);
                }

                onOpenChange(false);
                router.push(`/chat/${chatId}`);
            } catch (err: any) {
                console.error("Error processing QR code:", err);
                toast({ title: 'Error', description: err.message || 'Could not process QR code.', variant: 'destructive' });
                setError(err.message || 'Could not process QR code.');
                setIsProcessing(false);
            }
        };

        const onScanFailure = (errorMessage: string) => {
            if (!errorMessage.includes('No QR code found')) {
                console.warn(`QR Scan Error: ${errorMessage}`);
            }
        };

        const startScanner = async () => {
            setError(null); // Clear previous errors
            try {
                await Html5Qrcode.getCameras();
                setHasPermission(true);
                
                html5QrcodeScanner = new Html5QrcodeScanner(
                    'qr-reader',
                    {
                        fps: 10,
                        qrbox: { width: QR_REGION_SIZE, height: QR_REGION_SIZE },
                        rememberLastUsedCamera: true,
                        supportedScanTypes: [],
                    },
                    false
                );
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            } catch (err: any) {
                console.error("Camera permission error:", err);
                setError("Camera permission denied. Please allow camera access in your browser settings.");
                setHasPermission(false);
                toast({
                    title: "Camera Access Required",
                    description: "Please enable camera permissions to scan QR codes.",
                    variant: "destructive",
                });
            }
        }
        
        startScanner();

        return () => {
            if (html5QrcodeScanner) {
                const scannerElement = document.getElementById('qr-reader');
                if (scannerElement && scannerElement.innerHTML !== '') {
                    html5QrcodeScanner.clear().catch(err => {
                        console.error("Failed to clear QR code scanner.", err);
                    });
                }
                html5QrcodeScanner = null;
            }
        };
    }, [isOpen, isProcessing, currentUser, onOpenChange, router, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><QrCode/> Scan User QR Code</DialogTitle>
                    <DialogDescription>
                        Point your camera at another user's QR code to add them as a contact.
                    </DialogDescription>
                </DialogHeader>
                <div 
                    className="relative w-full aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center"
                >
                    <div id="qr-reader" className="w-full" />
                    
                    {hasPermission === null && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            <p className="font-semibold">Requesting Camera Access...</p>
                        </div>
                    )}

                    {hasPermission === false && error && (
                         <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-2 text-center p-4">
                            <ShieldAlert className="h-8 w-8 text-destructive"/>
                            <p className="font-semibold text-destructive">Camera Error</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    )}

                    {isProcessing && (
                         <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            <p className="font-semibold">Processing QR Code...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
