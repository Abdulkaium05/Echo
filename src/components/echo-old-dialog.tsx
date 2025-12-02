
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
          <DialogTitle className="text-xl">The Story of Echo</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-center text-muted-foreground space-y-3">
            <p>
                This app was made on May 2025 for just a fun purpose but when the developer became serious, he didn't know.
            </p>
            <p>
                Anyhow, he completed this app with some bugs. You know, not all bugs can be solved with zero code knowledge but he tried so hard.
            </p>
             <p className="font-semibold text-foreground pt-2">
                Do you want to know how it looked when it was first made? Wanna see the old version of this app?
            </p>
        </div>
        <DialogFooter>
            <a
              href="https://echo-old.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              Go back to odd echo
            </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
