
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserProfile } from "@/context/auth-context";
import { Mail, Wrench } from "lucide-react";
import { OutlineBirdIcon } from "../chat/bot-icons";
import { Leaf, Bot } from 'lucide-react';
import { ScrollArea } from "../ui/scroll-area";

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
                <Mail className="h-16 w-16 text-primary" strokeWidth={1.5} />
            </div>
          <DialogTitle className="text-2xl font-bold">A Message from the Team!</DialogTitle>
           <DialogDescription>
            Your feature suggestion was approved! Here's a special message for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4 pb-2">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary border mb-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={devProfile.avatarUrl} alt={devProfile.name} />
                    <AvatarFallback className="text-2xl">{devFallback}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{devProfile.name}</span>
                    {devProfile.isDevTeam && <Wrench className="h-5 w-5 text-blue-600" />}
                </div>
            </div>

            <Tabs defaultValue="blue-bird" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="blue-bird" className="px-1"><OutlineBirdIcon className="mr-2 h-4 w-4 text-sky-500"/> Blue Bird</TabsTrigger>
                <TabsTrigger value="green-leaf" className="px-1"><Leaf className="mr-2 h-4 w-4 text-green-500"/> Green Leaf</TabsTrigger>
                <TabsTrigger value="echo-bot" className="px-1"><Bot className="mr-2 h-4 w-4 text-foreground/70"/> Echo Bot</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-32 mt-4">
                <TabsContent value="blue-bird" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed p-1">
                  Knock, knock...
                  Who's there?
                  An awesome new feature, thanks to you!

                  The dev team loved your idea so much, they decided to build it. As a token of their immense gratitude, you've been awarded the exclusive Creator badge and 10,000 points. Keep those brilliant ideas coming!
                </TabsContent>
                 <TabsContent value="green-leaf" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed p-1">
                  A seed of thought, carefully planted...
                  Has blossomed into a new branch for our forest.

                  The caretakers of this grove were moved by your wisdom. For your contribution, a Creator's emblem now graces your profile, and 10,000 motes of light have been gifted to you. May your path here continue to be fruitful.
                </TabsContent>
                 <TabsContent value="echo-bot" className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed p-1 font-mono">
                  [Incoming Transmission]
                  ...
                  [Source: Dev Team]
                  ...
                  [Subject: Proposal Status - APPROVED]

                  Your submitted feature proposal has been analyzed and deemed optimal for integration. Protocol dictates reward disbursement. You are now designated as 'Creator'. Point balance incremented by 10,000 units. End of transmission.
                </TabsContent>
              </ScrollArea>
            </Tabs>
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
