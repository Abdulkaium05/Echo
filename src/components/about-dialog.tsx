// src/components/about-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "./logo";
import { Info, Code, Heart, Instagram, Facebook, Shield, FileText, History, Star, Crown, Wrench, SmilePlus, FlaskConical, Bot as BotIcon, Leaf } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    OutlineBirdIcon,
    SquareBotBadgeIcon,
    CreatorLetterCBBadgeIcon,
    PioneerBadgeIcon,
    PatronBadgeIcon,
    CreatorLv2BadgeIcon,
    MemeCreatorLv2BadgeIcon,
    BetaTesterLv2BadgeIcon,
    CreatorLv3BadgeIcon,
    VipLv3BadgeIcon,
    PatronLv3BadgeIcon,
    PioneerLv3BadgeIcon,
    MemeCreatorLv3BadgeIcon,
    BetaTesterLv3BadgeIcon,
    BotLv3BadgeIcon,
    RubyIcon,
    RubyCreatorIcon, RubyVipIcon, RubyVerifiedIcon, RubyDeveloperIcon, RubyMemeCreatorIcon, RubyBetaTesterIcon, RubyBotIcon,
    EmeraldIcon,
    EmeraldCreatorIcon, EmeraldVipIcon, EmeraldVerifiedIcon, EmeraldDeveloperIcon, EmeraldMemeCreatorIcon, EmeraldBetaTesterIcon, EmeraldBotIcon,
} from './chat/bot-icons';
import { ScrollArea } from "./ui/scroll-area";
import { VerifiedBadge } from "./verified-badge";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Colored wrappers for Lucide icons
const ColoredCrown = (props: any) => <Crown {...props} className={cn(props.className, "text-yellow-500")} />;
const ColoredWrench = (props: any) => <Wrench {...props} className={cn(props.className, "text-blue-600")} />;
const ColoredBotIcon = (props: any) => <BotIcon {...props} className={cn(props.className, "text-sky-500")} />;
const ColoredSmilePlus = (props: any) => <SmilePlus {...props} className={cn(props.className, "text-green-500")} />;
const ColoredFlaskConical = (props: any) => <FlaskConical {...props} className={cn(props.className, "text-orange-500")} />;
const ColoredLeaf = (props: any) => <Leaf {...props} className={cn(props.className, "text-green-500")} />;


const iconGroups = {
    "Base Badges": [
        { name: 'Creator', Icon: CreatorLetterCBBadgeIcon },
        { name: 'VIP', Icon: ColoredCrown },
        { name: 'Verified', Icon: VerifiedBadge },
        { name: 'Developer', Icon: ColoredWrench },
        { name: 'Bot', Icon: ColoredBotIcon },
        { name: 'Meme Creator', Icon: ColoredSmilePlus },
        { name: 'Beta Tester', Icon: ColoredFlaskConical },
    ],
    "Level 2 Badges": [
        { name: 'Developer 2.0', Icon: PioneerBadgeIcon },
        { name: 'Verified 2.0', Icon: PatronBadgeIcon },
        { name: 'Creator Lvl 2', Icon: CreatorLv2BadgeIcon },
        { name: 'Meme Creator Lvl 2', Icon: MemeCreatorLv2BadgeIcon },
        { name: 'Beta Tester Lvl 2', Icon: BetaTesterLv2BadgeIcon },
    ],
    "Level 3 (Diamond)": [
        { name: 'Creator Lvl 3', Icon: CreatorLv3BadgeIcon },
        { name: 'VIP 3.0', Icon: VipLv3BadgeIcon },
        { name: 'Verified 3.0', Icon: PatronLv3BadgeIcon },
        { name: 'Developer 3.0', Icon: PioneerLv3BadgeIcon },
        { name: 'Meme Creator Lvl 3', Icon: MemeCreatorLv3BadgeIcon },
        { name: 'Beta Tester Lvl 3', Icon: BetaTesterLv3BadgeIcon },
        { name: 'Bot Lvl 3', Icon: BotLv3BadgeIcon },
    ],
    "Level 4 (Ruby)": [
        { name: 'Ruby Creator', Icon: RubyCreatorIcon },
        { name: 'Ruby VIP', Icon: RubyVipIcon },
        { name: 'Ruby Verified', Icon: RubyVerifiedIcon },
        { name: 'Ruby Developer', Icon: RubyDeveloperIcon },
        { name: 'Ruby Meme Creator', Icon: RubyMemeCreatorIcon },
        { name: 'Ruby Beta Tester', Icon: RubyBetaTesterIcon },
        { name: 'Ruby Bot', Icon: RubyBotIcon },
    ],
     "Level 5 (Emerald)": [
        { name: 'Emerald Creator', Icon: EmeraldCreatorIcon },
        { name: 'Emerald VIP', Icon: EmeraldVipIcon },
        { name: 'Emerald Verified', Icon: EmeraldVerifiedIcon },
        { name: 'Emerald Developer', Icon: EmeraldDeveloperIcon },
        { name: 'Emerald Meme Creator', Icon: EmeraldMemeCreatorIcon },
        { name: 'Emerald Beta Tester', Icon: EmeraldBetaTesterIcon },
        { name: 'Emerald Bot', Icon: EmeraldBotIcon },
    ],
    "Special Icons": [
        { name: 'Blue Bird', Icon: OutlineBirdIcon },
        { name: 'Green Leaf', Icon: ColoredLeaf },
        { name: 'Bot Badge', Icon: SquareBotBadgeIcon },
    ]
}

const IconCard = ({ name, Icon }: { name: string, Icon: React.FC<any> }) => (
    <div className="flex flex-col items-center justify-center gap-2 p-3 border rounded-lg bg-secondary/50">
        <Icon className="h-8 w-8" />
        <span className="text-xs text-muted-foreground text-center">{name}</span>
    </div>
);


export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 items-center text-center bg-gradient-to-br from-primary/10 to-accent/20 border-b">
          <div className="p-3 rounded-full bg-background/50 border shadow-sm mb-2">
            <Logo className="h-10" />
          </div>
          <DialogTitle className="text-xl">About Echo Message</DialogTitle>
          <DialogDescription>
            Version 1.5.0 (August 2024)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">
                <Info className="mr-2 h-4 w-4" /> About
              </TabsTrigger>
              <TabsTrigger value="credits">
                <Heart className="mr-2 h-4 w-4" /> Credits
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" /> History
              </TabsTrigger>
              <TabsTrigger value="icons">
                <Star className="mr-2 h-4 w-4" /> Icons
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="about" className="px-6 py-4 text-sm text-center text-muted-foreground space-y-3">
            <p>
              This app, Echo, was crafted with a single vision: to create a messaging experience that's not just functional, but fun. It's a place for real-time chats, powered by a smart AI companion, all wrapped in an interface you can make your own.
            </p>
            <p>
              Thank you for being a part of this journey.
            </p>
          </TabsContent>
          <TabsContent value="credits" className="px-6 py-4 text-sm text-center text-muted-foreground space-y-4">
             <div className="space-y-1">
                <p className="font-semibold text-foreground">Lead Developer & Creator</p>
                <p>Abdul-Kaium</p>
            </div>
            <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <a href="https://www.facebook.com/Abdul.Kaium.05" target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /></a>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                    <a href="https://www.instagram.com/Abdul.Kaium.05" target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /></a>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                    <a href="https://echo-message.com" target="_blank" rel="noopener noreferrer"><Info className="h-4 w-4" /></a>
                </Button>
            </div>
             <p className="pt-2">
                Built with <Code className="inline h-4 w-4" /> and a lot of <Heart className="inline h-4 w-4 text-red-500" />.
             </p>
          </TabsContent>
          <TabsContent value="history" className="px-6 py-4 text-sm text-center text-muted-foreground space-y-3">
            <p>
                This app started as a fun side-project in August 2024. What began as a simple experiment quickly grew into a passion, filled with late nights, lots of learning, and a few (okay, maybe more than a few) bugs.
            </p>
            <p className="font-bold text-foreground">This app was fully useable on 2-Dec-2025.</p>
             <p className="font-semibold text-foreground pt-2">
                Want to see how far we've come? Check out the original version of the app!
            </p>
             <div className="pt-2">
                 <a
                  href="https://echo-old.vercel.app/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Visit the Original Echo
                </a>
            </div>
          </TabsContent>
          <TabsContent value="icons" className="px-6 py-4">
             <ScrollArea className="h-64">
                <div className="space-y-4">
                    {Object.entries(iconGroups).map(([groupName, icons]) => (
                        <div key={groupName}>
                            <h3 className="text-sm font-semibold text-foreground mb-2">{groupName}</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {icons.map((icon, index) => (
                                    <IconCard key={index} name={icon.name} Icon={icon.Icon} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
             </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="bg-secondary/50 p-3 border-t flex-row justify-between w-full">
          <div className="flex gap-2">
            <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0 h-auto">
                <Shield className="mr-1.5 h-3.5 w-3.5" /> Privacy Policy
            </Button>
            <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0 h-auto">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Terms of Service
            </Button>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
