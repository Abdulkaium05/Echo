// src/components/chat/bot-icons.tsx
import { cn } from '@/lib/utils';
import { Bot, Leaf } from 'lucide-react';

// New Main Avatar for Blue Bird
export const OutlineBirdIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-full w-full", className)}
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-8 16-18 7 1 2.2 3.8 4.4 6.5 4.3 1.5-.1 2.7-1.1 3.5-2.2-1.3-.1-2.8-.8-3.5-2.2.8.1 1.5.1 2.2.1 1.2 0 2.3-.4 3.2-1.1-1.2-.2-2.5-1-3.2-2.6.4.1.8.1 1.2.1.9 0 1.7-.2 2.4-.7-1.1-.2-2.1-1.1-2.4-2.4.3.1.7.1 1 .1.7 0 1.4-.1 2.1-.4-1.3-.3-2.4-1.4-2.4-2.8s.2-2.8 1.1-3.8c0 0 4.5 5.6 10.5 5.9z"/>
  </svg>
);

// Badge for Blue Bird - Uses Lucide Bot icon
export const SquareBotBadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <Bot
    className={cn("h-4 w-4 text-[hsl(var(--bot-accent-color))] shrink-0", className)}
    strokeWidth={props.strokeWidth || 2}
    fill="none"
    {...props}
  />
);

// New Creator "C" Badge Icon
export const CreatorLetterCBBadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg 
      width="22" 
      height="22" 
      viewBox="0 0 22 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle cx="11" cy="11" r="10" fill="#A78BFA" stroke="#6D28D9" strokeWidth="2"/>
      <text 
        x="11" 
        y="15.5" 
        textAnchor="middle" 
        fontFamily="Arial, Helvetica, sans-serif" 
        fontSize="14" 
        fontWeight="bold" 
        fill="white"
      >
        C
      </text>
    </svg>
);
