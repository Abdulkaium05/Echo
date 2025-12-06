
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
import { PartyPopper, Lightbulb, Bot, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionApprovedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  devProfile: UserProfile | null;
}

export function SuggestionApprovedDialog({ isOpen, onOpenChange, devProfile }: SuggestionApprovedDialogProps) {

  if (!devProfile) return null;

  const devFallback = devProfile.name.substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-4">
            <div className="relative">
                <PartyPopper className="h-16 w-16 text-primary animate-pulse" strokeWidth={1.5} />
                <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-full shadow-md">
                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                </div>
            </div>
          <DialogTitle className="text-2xl font-bold">Your Idea Was Approved!</DialogTitle>
          <div className="text-muted-foreground whitespace-pre-wrap text-center px-4">
            Knock Knock...
            Who's there?
            An awesome new feature, thanks to you!

            The dev team loved your idea. As a thank you, you've been awarded the Creator badge and 10,000 points!
          </div>
        </DialogHeader>
        
        <div className="pt-4 pb-2">
            <div className="text-sm text-center text-muted-foreground mb-3">From the team:</div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary border">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={devProfile.avatarUrl} alt={devProfile.name} />
                    <AvatarFallback className="text-2xl">{devFallback}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{devProfile.name}</span>
                    {devProfile.isDevTeam && <Wrench className="h-5 w-5 text-blue-600" />}
                </div>
            </div>
        </div>
        
        <DialogFooter>
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              That's Amazing!
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
