
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

interface VerifiedBadgeProps {
  className?: string;
  style?: CSSProperties;
}

export function VerifiedBadge({ className, style }: VerifiedBadgeProps) {
  return (
    <CheckCircle 
        className={cn("h-4 w-4 text-primary fill-primary/20", className)} 
        style={style}
    />
  );
}
