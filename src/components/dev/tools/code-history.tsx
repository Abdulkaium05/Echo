// src/components/dev/tools/code-history.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, History, Trash2, Copy, Crown, SmilePlus, FlaskConical, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
    getVipPromoCodes, getBadgeGiftCodes, getPointsPromoCodes,
    type VipPromoCode, type BadgeGiftCode, type PointsPromoCode,
    deleteVipPromoCode, deleteBadgeGiftCode, deletePointsPromoCode,
} from '@/services/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QRCode from "react-qr-code";
import type { BadgeType } from '@/app/(app)/layout';
import { CreatorLetterCBBadgeIcon } from '@/components/chat/bot-icons';
import { VerifiedBadge } from '@/components/verified-badge';

const badgeComponentMap: Record<Exclude<BadgeType, 'dev' | 'bot' | 'pioneer' | 'patron' | 'feature_suggestion_approved'>, React.FC<{className?: string}>> = {
  creator: CreatorLetterCBBadgeIcon,
  vip: (props) => <Crown {...props} />,
  verified: VerifiedBadge,
  meme_creator: (props) => <SmilePlus {...props} />,
  beta_tester: (props) => <FlaskConical {...props} />,
};

export function CodeHistoryTab() {
  const { toast } = useToast();

  const [promoCodeHistory, setPromoCodeHistory] = useState<VipPromoCode[]>([]);
  const [badgeCodeHistory, setBadgeCodeHistory] = useState<BadgeGiftCode[]>([]);
  const [pointsCodeHistory, setPointsCodeHistory] = useState<PointsPromoCode[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    const [vips, badges, points] = await Promise.all([getVipPromoCodes(), getBadgeGiftCodes(), getPointsPromoCodes()]);
    setPromoCodeHistory(vips);
    setBadgeCodeHistory(badges);
    setPointsCodeHistory(points);
    setIsLoadingHistory(false);
  };
  
  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteVipCode = async (code: string) => {
    try {
        await deleteVipPromoCode(code);
        toast({ title: "VIP Code Deleted", description: `Code ${code} has been removed.`, variant: "destructive" });
        await fetchHistory();
    } catch (error: any) {
        toast({ title: "Error Deleting Code", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteBadgeCode = async (code: string) => {
      try {
        await deleteBadgeGiftCode(code);
        toast({ title: "Badge Code Deleted", description: "The badge gift code has been removed.", variant: "destructive" });
        await fetchHistory();
    } catch (error: any) {
        toast({ title: "Error Deleting Code", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeletePointsCode = async (code: string) => {
      try {
        await deletePointsPromoCode(code);
        toast({ title: "Points Code Deleted", description: "The points promo code has been removed.", variant: "destructive" });
        await fetchHistory();
    } catch (error: any) {
        toast({ title: "Error Deleting Code", description: error.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation(); // Prevent the popover from opening when copying
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };
  
  const renderBadgeIcon = (badge: BadgeType) => {
    const BadgeIcon = badgeComponentMap[badge as Exclude<BadgeType, 'dev' | 'bot' | 'pioneer' | 'patron' | 'feature_suggestion_approved'>];
    if (!BadgeIcon) return null;
    return <BadgeIcon className="h-5 w-5" />;
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
                <History className="h-7 w-7 text-primary" />
                Generated Code History
            </CardTitle>
            <CardDescription>
                A list of all generated promo codes. Click a code or icon to see details.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingHistory ? (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-1">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500"/> VIP Promo Codes</h3>
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promoCodeHistory.length > 0 ? promoCodeHistory.map(code => (
                                        <TableRow key={code.code}>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="link" className="font-mono p-0 h-auto">{code.code}</Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto text-sm">
                                                        <div className="space-y-2">
                                                            <p><strong>Duration:</strong> {code.durationDays} days</p>
                                                            <p><strong>Uses:</strong> {Object.keys(code.claimedBy || {}).length} / {code.totalUses}</p>
                                                            <p><strong>Uses Per User:</strong> {code.usesPerUser}</p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => copyToClipboard(e, code.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete VIP Code?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete the code <code className="bg-muted px-1 py-0.5 rounded">{code.code}</code>? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteVipCode(code.code)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No VIP codes generated yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500"/> Points Promo Codes</h3>
                         <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pointsCodeHistory.length > 0 ? pointsCodeHistory.map(code => (
                                        <TableRow key={code.code}>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="link" className="font-mono p-0 h-auto">{code.code}</Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto text-sm">
                                                        <div className="space-y-2">
                                                            <p><strong>Amount:</strong> {code.amount} points</p>
                                                            <p><strong>Uses:</strong> {Object.keys(code.claimedBy || {}).length} / {code.totalUses}</p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => copyToClipboard(e, code.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Points Code?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete the code <code className="bg-muted px-1 py-0.5 rounded">{code.code}</code>? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeletePointsCode(code.code)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No points codes generated yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Badge Gift Codes</h3>
                         <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Badge</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {badgeCodeHistory.length > 0 ? badgeCodeHistory.map(code => (
                                        <TableRow key={code.code}>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" className="h-auto p-1 flex items-center justify-center">
                                                          {renderBadgeIcon(code.badgeType)}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-2 bg-white flex flex-col items-center gap-2">
                                                        <QRCode value={JSON.stringify(code)} size={128} />
                                                        <div className="text-xs text-center">
                                                            <p><strong>Duration:</strong> {code.durationDays} days</p>
                                                            <p><strong>Uses:</strong> {Object.keys(code.claimedBy || {}).length} / {code.totalUses}</p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Badge Code?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will invalidate the QR code for the {code.badgeType} badge. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteBadgeCode(code.code)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No badge gift codes generated yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
