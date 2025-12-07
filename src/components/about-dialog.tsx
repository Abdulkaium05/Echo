
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
import { Info, Code, Heart, Instagram, Facebook, Shield, FileText, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">
                <Info className="mr-2 h-4 w-4" /> About
              </TabsTrigger>
              <TabsTrigger value="credits">
                <Heart className="mr-2 h-4 w-4" /> Credits
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" /> History
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
