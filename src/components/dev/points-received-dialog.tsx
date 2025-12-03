
// src/components/dev/points-received-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/context/auth-context";
import { Coins, PartyPopper } from "lucide-react";
import type { BadgeType } from "@/app/(app)/layout";

interface PointsReceivedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gifterProfile: UserProfile | null;
  giftedPointsAmount: number | null;
}

export function PointsReceivedDialog({ isOpen, onOpenChange, gifterProfile, giftedPointsAmount }: PointsReceivedDialogProps) {

  if (!gifterProfile || !giftedPointsAmount) return null;
  
  const gifterFallback = gifterProfile.name.substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center space-y-4">
            <div className="relative">
                <PartyPopper className="h-16 w-16 text-primary animate-pulse" strokeWidth={1.5} />
                <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-full shadow-md">
                    <Coins className="h-6 w-6 text-yellow-500" />
                </div>
            </div>
          <DialogTitle className="text-2xl font-bold">You've Received Points!</DialogTitle>
          <div className="text-muted-foreground">
            You received{' '}
            <span className="font-semibold text-primary inline-flex items-center gap-1.5">
                {giftedPointsAmount} Points
            </span>
            !
          </div>
        </DialogHeader>
        
        <div className="pt-4 pb-2">
            <div className="text-sm text-center text-muted-foreground mb-3">Gifted by:</div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary border">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={gifterProfile.avatarUrl} alt={gifterProfile.name} />
                    <AvatarFallback className="text-2xl">{gifterFallback}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{gifterProfile.name}</span>
                </div>
            </div>
        </div>
        
        <DialogFooter>
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              Awesome!
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    