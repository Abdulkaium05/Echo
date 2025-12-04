
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface EchoOldDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EchoOldDialog({ isOpen, onOpenChange }: EchoOldDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <History className="h-10 w-10 mb-2 text-primary" />
          <DialogTitle className="text-xl">A Blast from the Past</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-center text-muted-foreground space-y-3">
            <p>
                This app started as a fun side-project in May 2025. What began as a simple experiment quickly grew into a passion.
            </p>
            <p>
                It's a journey filled with late nights, lots of learning, and a few (okay, maybe more than a few) bugs along the way.
            </p>
             <p className="font-semibold text-foreground pt-2">
                Want to see how far we've come? Check out the original version of the app!
            </p>
        </div>
        <DialogFooter>
            <a
              href="https://echo-old.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              Visit the Original Echo
            </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
