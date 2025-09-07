
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  // Add any specific props if needed
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="-2 -2 140 45" // Adjusted viewBox to fit the full logo
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMin"
      className={cn("text-primary h-6", className)}
      {...props}
    >
      {/* Icon path, scaled */}
      <g transform="scale(2)">
        <path
          d='M3 .858h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6.958l-6.444 4.808A1 1 0 0 1 2 18.864v-4.006a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3zm10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'
          fill="currentColor"
        />
      </g>
      
      {/* "ECHO" text, grouped, scaled, and repositioned */}
      {/* The .transparent-mode selector will make the text hollow */}
      <g 
        transform="translate(50, -1.8) scale(0.5)" 
        className="fill-current stroke-none transparent-mode:fill-transparent transparent-mode:stroke-current" 
        strokeWidth="3"
      >
        {/* E */}
        <g className="letter" transform="translate(10,20)">
          <rect x="0" y="0" width="20" height="8" rx="2"/>
          <rect x="0" y="12" width="16" height="8" rx="2"/>
          <rect x="0" y="24" width="20" height="8" rx="2"/>
        </g>
        {/* C */}
        <path className="letter" d="M55 20 a15 15 0 0 0 0 30" stroke="currentColor" fill="transparent" strokeWidth="6" />
        {/* H */}
        <g className="letter">
          <rect x="70" y="20" width="6" height="30" rx="2"/>
          <rect x="90" y="20" width="6" height="30" rx="2"/>
          <rect x="70" y="32" width="26" height="6" rx="2"/>
        </g>
        {/* O */}
        <circle 
            className="letter" 
            cx="120" 
            cy="35" 
            r="12" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
        />
      </g>
    </svg>
  );
}
