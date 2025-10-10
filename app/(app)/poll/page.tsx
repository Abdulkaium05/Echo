// src/app/(app)/poll/page.tsx
'use client';

import { BarChart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PollPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
       <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Poll Creation</h2>
      <p className="text-muted-foreground max-w-md">
        This feature is under construction. Soon, developers will be able to create polls with photos and text here.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/chat">
            Go Back to Chats
        </Link>
      </Button>
    </div>
  );
}

    