// src/app/(app)/rate-report/page.tsx
'use client';

import { Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RateReportPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
       <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Feature Under Construction</h2>
      <p className="text-muted-foreground max-w-md">
        We're currently upgrading our Rate & Report system to bring you a better experience. It will be available again soon!
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/chat">
            Go Back to Chats
        </Link>
      </Button>
    </div>
  );
}
