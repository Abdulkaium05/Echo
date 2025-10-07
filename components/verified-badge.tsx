import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <CheckCircle className={cn("h-4 w-4 text-primary fill-primary/20", className)} />
  );
}
