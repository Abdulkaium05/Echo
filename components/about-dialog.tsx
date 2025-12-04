
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
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Info } from "lucide-react";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <Logo className="h-12 mb-2" />
          <DialogTitle className="text-xl">About Echo Message</DialogTitle>
          <DialogDescription>
            Version 1.0.0 (Demo)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-center text-muted-foreground space-y-2">
            <p>
                This app, Echo, was crafted with a single vision: to create a messaging experience that's not just functional, but fun. It's a place for real-time chats, powered by a smart AI companion, all wrapped in an interface you can make your own. Thank you for being a part of this journey.
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" className="w-full">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
