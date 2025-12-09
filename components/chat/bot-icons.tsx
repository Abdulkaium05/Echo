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

// Original simple Creator "C" Badge
export const CreatorLetterCBBadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="creatorPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#creatorPurple)" stroke="#6b21a8" strokeWidth="1.5" />
        <text x="12" y="16.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="bold" fill="white">C</text>
    </svg>
);

// LVL 3 Creator Badge (Diamond design)
export const CreatorLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
    <defs>
        <linearGradient id="creatorDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        <style>{`@keyframes pulse-diamond {0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px #a6e1ff); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 6px #a6e1ff); }}`}</style>
    </defs>
    <g style={{animation: 'pulse-diamond 2.5s infinite ease-in-out'}}>
      <path d="M12 2L2 8l10 14L22 8z" fill="url(#creatorDiamond)" stroke="#7fbdff" strokeWidth="1.5"/>
      <text x="12" y="15" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="bold" fill="white" stroke="#3d8bff" strokeWidth="0.5">C</text>
    </g>
  </svg>
);

// New Golden Pioneer (Level 2 Dev) Badge
export const PioneerBadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        {...props}
    >
        <defs>
            <linearGradient id="pioneerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#FFD700'}} />
                <stop offset="100%" style={{stopColor: '#FFA500'}} />
            </linearGradient>
            <style>
                {`
                    @keyframes sparkle {
                        0%, 100% { opacity: 0.5; transform: scale(0.8); }
                        50% { opacity: 1; transform: scale(1.2); }
                    }
                    .sparkle {
                        animation: sparkle 2s infinite ease-in-out;
                    }
                `}
            </style>
        </defs>
        {/* Wrench Icon */}
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="url(#pioneerGold)" stroke="#B8860B" strokeWidth="1"/>
        {/* Wings */}
        <path d="M8 8c-2.5 0-4-2-4-2s1.5 2 4 2z" fill="url(#pioneerGold)" stroke="#B8860B" strokeWidth="1" transform="rotate(-30, 6, 6)"/>
        <path d="M16 8c2.5 0 4-2 4-2s-1.5 2-4 2z" fill="url(#pioneerGold)" stroke="#B8860B" strokeWidth="1" transform="rotate(30, 18, 6)"/>
        {/* Sparkles */}
        <circle className="sparkle" cx="5" cy="5" r="1" fill="#FFF" style={{animationDelay: '0s'}}/>
        <circle className="sparkle" cx="19" cy="5" r="1" fill="#FFF" style={{animationDelay: '0.5s'}}/>
        <circle className="sparkle" cx="12" cy="18" r="1" fill="#FFF" style={{animationDelay: '1s'}} />
    </svg>
);

// New Golden Patron (Level 2 Verified) Badge
export const PatronBadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        {...props}
    >
        <defs>
            <linearGradient id="patronGoldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7E0" />
                <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient id="patronGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
             <style>
                {`
                    @keyframes sparkle-subtle {
                        0%, 100% { opacity: 0.2; }
                        50% { opacity: 0.8; }
                    }
                    .sparkle-sm {
                        animation: sparkle-subtle 2.5s infinite ease-in-out;
                    }
                `}
            </style>
        </defs>
        {/* Golden Check Circle */}
        <circle cx="12" cy="12" r="10" fill="url(#patronGoldFill)" stroke="url(#patronGoldStroke)" strokeWidth="2" />
        <path d="m9 12 2 2 4-4" stroke="#A16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Sparkles */}
        <circle className="sparkle-sm" cx="6" cy="6" r="0.8" fill="#FFF" style={{animationDelay: '0s'}}/>
        <circle className="sparkle-sm" cx="18" cy="6" r="0.8" fill="#FFF" style={{animationDelay: '0.8s'}}/>
    </svg>
);

// LVL 2 Creator Badge
export const CreatorLv2BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="creatorGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD700"/><stop offset="100%" stopColor="#FFA500"/></linearGradient>
            <style>{`@keyframes sparkle-creator {0%, 100% { opacity: 0.5; } 50% { opacity: 1; }}.sparkle-creator { animation: sparkle-creator 2.5s infinite; }`}</style>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#creatorGold)" stroke="#B8860B" strokeWidth="1.5"/>
        <text x="12" y="16.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fontWeight="bold" fill="white" stroke="#A16207" strokeWidth="0.5">C</text>
        <circle className="sparkle-creator" cx="7" cy="7" r="1" fill="#FFF" style={{animationDelay: '0.2s'}}/>
        <circle className="sparkle-creator" cx="17" cy="7" r="1" fill="#FFF" style={{animationDelay: '1.2s'}}/>
    </svg>
);

// LVL 2 Meme Creator Badge
export const MemeCreatorLv2BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="memeGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF7E0"/><stop offset="100%" stopColor="#FFD700"/></linearGradient>
            <style>{`@keyframes rotate-face { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } } .rotate-face { animation: rotate-face 3s infinite alternate ease-in-out; transform-origin: center; }`}</style>
        </defs>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#memeGold)" stroke="#B8860B" strokeWidth="1.5"/>
        <g className="rotate-face">
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#A16207" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 9h.01" stroke="#A16207" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 9h.01" stroke="#A16207" strokeWidth="2" strokeLinecap="round"/>
        </g>
    </svg>
);

// LVL 2 Beta Tester Badge
export const BetaTesterLv2BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="betaGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#DAA520"/><stop offset="100%" stopColor="#F0E68C"/></linearGradient>
            <style>{`
                @keyframes bubble { 
                    0% { transform: translateY(0) scale(0.8); opacity: 0; } 
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: translateY(-8px) scale(0.8); opacity: 0; } 
                } 
                .bubble { animation: bubble 2s infinite ease-out; }
            `}</style>
        </defs>
        <path d="M10 2v7.31M14 9.31V2" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 13.31L6 22h12l-4-8.69" fill="url(#betaGold)" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle className="bubble" cx="12" cy="15" r="1.5" fill="#FFF" style={{animationDelay: '0s'}}/>
        <circle className="bubble" cx="10" cy="17" r="1" fill="#FFF" style={{animationDelay: '0.7s'}}/>
        <circle className="bubble" cx="14" cy="17" r="1" fill="#FFF" style={{animationDelay: '1.4s'}}/>
    </svg>
);


// LVL 3 Badges (kept for about dialog)
export const VipLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="vipDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
            <style>{`@keyframes sparkle-diamond-vip { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } } .sparkle-diamond-vip { animation: sparkle-diamond-vip 2s infinite; }`}</style>
        </defs>
        <path d="M12 2l-2.5 5-5.5.8 4 3.9-1 5.5 5-2.6 5 2.6-1-5.5 4-3.9-5.5-.8L12 2z" fill="url(#vipDiamond)" stroke="#7fbdff" strokeWidth="1.5"/>
        <circle className="sparkle-diamond-vip" cx="12" cy="4" r="1" fill="white" style={{animationDelay: '0s'}}/>
        <circle className="sparkle-diamond-vip" cx="6" cy="18" r="1" fill="white" style={{animationDelay: '0.5s'}}/>
        <circle className="sparkle-diamond-vip" cx="18" cy="18" r="1" fill="white" style={{animationDelay: '1s'}}/>
    </svg>
);
export const PatronLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="patronDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#patronDiamond)" stroke="#7fbdff" strokeWidth="2"/>
        <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
export const PioneerLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="pioneerDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        </defs>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="url(#pioneerDiamond)" stroke="#7fbdff" strokeWidth="1.5"/>
        <path d="M8 8c-2.5 0-4-2-4-2s1.5 2 4 2z" fill="url(#pioneerDiamond)" stroke="#7fbdff" strokeWidth="1.5" transform="rotate(-30, 6, 6)"/>
        <path d="M16 8c2.5 0 4-2 4-2s-1.5 2-4 2z" fill="url(#pioneerDiamond)" stroke="#7fbdff" strokeWidth="1.5" transform="rotate(30, 18, 6)"/>
    </svg>
);
export const MemeCreatorLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="memeDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        </defs>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#memeDiamond)" stroke="#7fbdff" strokeWidth="2"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
export const BetaTesterLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="betaDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        </defs>
        <path d="M10 2v7.31M14 9.31V2" stroke="#7fbdff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 13.31L6 22h12l-4-8.69" fill="url(#betaDiamond)" stroke="#7fbdff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
export const BotLv3BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="botDiamond" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b9f2ff"/><stop offset="100%" stopColor="#99c3ff"/></linearGradient>
        </defs>
        <path d="M12 8V4H8" stroke="url(#botDiamond)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 4h-4" stroke="url(#botDiamond)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="8" width="16" height="12" rx="2" fill="url(#botDiamond)" stroke="#7fbdff" strokeWidth="1.5"/>
        <path d="M8 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Level 4 - Ruby Icons
const rubyDefs = (
    <defs>
        <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff4b4b"/><stop offset="100%" stopColor="#c40000"/></linearGradient>
    </defs>
);
export const RubyCreatorIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<path d="M12 2L2 8l10 14L22 8z" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="1.5"/><text x="12" y="15" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="bold" fill="white" stroke="#3d0000" strokeWidth="0.5">C</text></svg>);
export const RubyVipIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<path d="M12 2l-2.5 5-5.5.8 4 3.9-1 5.5 5-2.6 5 2.6-1-5.5 4-3.9-5.5-.8L12 2z" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="1.5" /></svg>);
export const RubyVerifiedIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<circle cx="12" cy="12" r="10" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="2" /><path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
export const RubyDeveloperIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="1.5" /></svg>);
export const RubyMemeCreatorIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M9 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M15 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>);
export const RubyBetaTesterIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<path d="M10 2v7.31M14 9.31V2" stroke="#8b0000" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 13.31L6 22h12l-4-8.69" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
export const RubyBotIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{rubyDefs}<rect x="4" y="8" width="16" height="12" rx="2" fill="url(#rubyGrad)" stroke="#8b0000" strokeWidth="1.5"/><path d="M8 12h.01M16 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);

// Level 5 - Emerald Icons
const emeraldDefs = (
    <defs>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#50c878"/><stop offset="100%" stopColor="#007f5f"/></linearGradient>
    </defs>
);
export const EmeraldCreatorIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="1.5" /><text x="12" y="15" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="bold" fill="white" stroke="#002d25" strokeWidth="0.5">C</text></svg>);
export const EmeraldVipIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<path d="M12 2l-2.5 5-5.5.8 4 3.9-1 5.5 5-2.6 5 2.6-1-5.5 4-3.9-5.5-.8L12 2z" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="1.5" /></svg>);
export const EmeraldVerifiedIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<circle cx="12" cy="12" r="10" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="2" /><path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
export const EmeraldDeveloperIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="1.5" /></svg>);
export const EmeraldMemeCreatorIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M9 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M15 9h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>);
export const EmeraldBetaTesterIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<path d="M10 2v7.31M14 9.31V2" stroke="#004d40" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 13.31L6 22h12l-4-8.69" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
export const EmeraldBotIcon = ({ className }: { className?: string }) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>{emeraldDefs}<rect x="4" y="8" width="16" height="12" rx="2" fill="url(#emeraldGrad)" stroke="#004d40" strokeWidth="1.5"/><path d="M8 12h.01M16 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);


// Level 2 aliases for consistency
export const PioneerLv2BadgeIcon = PioneerBadgeIcon;
export const PatronLv2BadgeIcon = PatronBadgeIcon;

// Level 2 Bot Badge
export const BotLv2BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="botGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD700"/><stop offset="100%" stopColor="#FFA500"/></linearGradient>
            <style>{`
                @keyframes glow { 
                    0%, 100% { filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #FFD700); }
                    50% { filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #FFD700); }
                }
                .glow { animation: glow 2.5s infinite ease-in-out; }
            `}</style>
        </defs>
        <g className="glow">
            <path d="M12 8V4H8" stroke="url(#botGold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 4h-4" stroke="url(#botGold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="4" y="8" width="16" height="12" rx="2" fill="url(#botGold)" stroke="#B8860B" strokeWidth="1.5"/>
            <path d="M8 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 12h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

// Level 2 VIP Badge
export const VipLv2BadgeIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)} {...props}>
        <defs>
            <linearGradient id="vipGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD700"/><stop offset="100%" stopColor="#C0A000"/></linearGradient>
            <style>{`@keyframes sparkle-vip {0%, 100% { opacity: 0.6; } 50% { opacity: 1; }}.sparkle-vip { animation: sparkle-vip 2s infinite ease-in-out; }`}</style>
        </defs>
        <path d="M5.5 12.5L2 22l10-4 10 4-3.5-9.5L22 8H2l3.5 4.5z" stroke="#B8860B" strokeWidth="1.5" fill="url(#vipGold)"/>
        <path d="M12 2l2.35 4.7L20 8l-6 4.85L16.35 20 12 17.3 7.65 20 9 12.85 3 8l6.65-.3L12 2z" stroke="#B8860B" strokeWidth="1.5" fill="url(#vipGold)"/>
        <circle className="sparkle-vip" cx="12" cy="4" r="1" fill="white" style={{animationDelay: '0s'}}/>
        <circle className="sparkle-vip" cx="6" cy="18" r="1" fill="white" style={{animationDelay: '0.7s'}}/>
        <circle className="sparkle-vip" cx="18" cy="18" r="1" fill="white" style={{animationDelay: '1.4s'}}/>
    </svg>
);
