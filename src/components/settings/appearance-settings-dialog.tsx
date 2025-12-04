
// src/components/settings/appearance-settings-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Moon, Sun, Droplets, Palette, Crown, Lock, Flame, Leaf, Waves } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useVIP } from '@/context/vip-context';

interface AppearanceSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'light' | 'dark';
type Theme = 'theme-sky-blue' | 'theme-light-green' | 'theme-midnight' | 'theme-solaris' | 'theme-forest' | 'theme-ocean' | 'theme-crimson';

const generalThemes: { name: Theme, label: string, color: string }[] = [
    { name: 'theme-sky-blue', label: 'Sky Blue', color: 'bg-sky-500' },
    { name: 'theme-light-green', label: 'Light Green', color: 'bg-green-500' },
];

const vipThemes: { name: Theme, label: string, color: string, icon: React.FC<any> }[] = [
    { name: 'theme-midnight', label: 'Midnight', color: 'bg-violet-600', icon: Moon },
    { name: 'theme-solaris', label: 'Solaris', color: 'bg-orange-500', icon: Sun },
    { name: 'theme-forest', label: 'Forest', color: 'bg-emerald-600', icon: Leaf },
    { name: 'theme-ocean', label: 'Ocean', color: 'bg-blue-600', icon: Waves },
    { name: 'theme-crimson', label: 'Crimson', color: 'bg-red-600', icon: Flame },
];

const allThemes = [...generalThemes, ...vipThemes];


const ModeCard = ({
    mode,
    label,
    icon,
    selectedMode,
    onClick,
    theme
}: {
    mode: Mode;
    label: string;
    icon: React.ReactNode;
    selectedMode: Mode;
    onClick: () => void;
    theme: Theme;
}) => {
    const isSelected = selectedMode === mode;
    const themeInfo = allThemes.find(t => t.name === theme);
    const primaryColor = themeInfo ? themeInfo.color : 'bg-sky-500';
    
    const sentBubbleColor = primaryColor;
    const receivedBubbleColor = mode === 'light' ? 'bg-gray-200' : 'bg-gray-700';

    return (
        <div onClick={onClick} className={cn(
            'rounded-lg border-2 p-3 cursor-pointer transition-all duration-300 relative group',
            isSelected ? 'border-primary' : 'border-muted hover:border-muted-foreground/50'
        )}>
            <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2 font-semibold cursor-pointer">{icon} {label}</Label>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  isSelected ? "bg-primary border-primary scale-100" : "border-muted-foreground group-hover:border-primary scale-90"
                )}>
                   {isSelected && <Check className="h-3 w-3 text-primary-foreground transition-transform duration-300 scale-100"/>}
                </div>
            </div>
            <div className={cn(
                "p-2 rounded-md transition-colors",
                mode === 'light' ? 'bg-white' : 'bg-zinc-800'
            )}>
                <div className="space-y-1.5">
                    <div className={cn("w-3/5 h-3 rounded-md", receivedBubbleColor)}></div>
                    <div className="flex justify-end">
                       <div className={cn("w-4/5 h-3 rounded-md", sentBubbleColor)}></div>
                    </div>
                     <div className={cn("w-1/2 h-3 rounded-md", receivedBubbleColor)}></div>
                </div>
            </div>
        </div>
    )
}

const TransparentModeCard = ({
    mode,
    theme,
    isEnabled,
    onClick,
}: {
    mode: Mode;
    theme: Theme;
    isEnabled: boolean;
    onClick: () => void;
}) => {
    const themeInfo = allThemes.find(t => t.name === theme);
    const themeBubbleColor = themeInfo ? themeInfo.color : 'bg-sky-500';
    
    return (
        <div 
           onClick={onClick}
           className={cn(
                "rounded-lg border-2 p-3 cursor-pointer transition-all duration-300 relative group overflow-hidden",
                "bg-gradient-to-br from-primary/10 to-accent/20",
                isEnabled ? 'border-primary' : 'border-muted hover:border-muted-foreground/50'
           )}
        >
            {isEnabled && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse-slow backdrop-blur-sm"></div>
            )}
           <div className="flex items-center justify-between mb-2 relative">
                <Label className="flex items-center gap-2 font-semibold cursor-pointer"><Droplets/>Transparent Mode</Label>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  isEnabled ? "bg-primary border-primary scale-100" : "border-muted-foreground group-hover:border-primary scale-90"
                )}>
                   {isEnabled && <Check className="h-3 w-3 text-primary-foreground transition-transform duration-300 scale-100"/>}
                </div>
           </div>
           <div className={cn("p-2 rounded-md transition-colors relative", mode === 'light' ? 'bg-white/80' : 'bg-zinc-800/80')}>
                <div className="space-y-1.5">
                    <div className={cn(
                       "w-3/5 h-3 rounded-md transition-all duration-300",
                       isEnabled ? "bg-gray-500/20 border border-gray-400/30" : (mode === 'light' ? "bg-gray-200" : "bg-gray-700")
                    )}></div>
                    <div className="flex justify-end">
                       <div className={cn(
                         "w-4/5 h-3 rounded-md transition-all duration-300",
                          isEnabled ? `${themeBubbleColor}/20 border ${themeBubbleColor.replace('bg-','border-')}/50` : themeBubbleColor
                       )}></div>
                    </div>
                     <div className={cn(
                       "w-1/2 h-3 rounded-md transition-all duration-300",
                       isEnabled ? "bg-gray-500/20 border border-gray-400/30" : (mode === 'light' ? "bg-gray-200" : "bg-gray-700")
                     )}></div>
                </div>
           </div>
        </div>
    )
}

export function AppearanceSettingsDialog({ isOpen, onOpenChange }: AppearanceSettingsDialogProps) {
  const { toast } = useToast();
  const { hasVipAccess } = useVIP();
  const [mode, setMode] = useState<Mode>('light');
  const [theme, setTheme] = useState<Theme>('theme-sky-blue');
  const [transparentMode, setTransparentMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedMode = localStorage.getItem('theme_mode') as Mode | null;
    const savedTheme = localStorage.getItem('theme_color') as Theme | null;
    const savedTransparentMode = localStorage.getItem('transparent_mode') === 'true';

    const initialMode = savedMode || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const initialTheme = savedTheme || 'theme-sky-blue';
    
    setMode(initialMode);
    setTheme(initialTheme);
    setTransparentMode(savedTransparentMode);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    localStorage.setItem('theme_mode', mode);
  }, [mode, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const root = window.document.documentElement;
    allThemes.forEach(t => root.classList.remove(t.name));
    root.classList.add(theme);
    localStorage.setItem('theme_color', theme);
  }, [theme, isClient]);
  
  useEffect(() => {
    if (!isClient) return;
    
    const root = window.document.documentElement;
    if (transparentMode) {
        root.classList.add('transparent-mode');
    } else {
        root.classList.remove('transparent-mode');
    }
    localStorage.setItem('transparent_mode', String(transparentMode));
  }, [transparentMode, isClient]);


  const handleTransparentModeChange = (enabled: boolean) => {
    setTransparentMode(enabled);
    toast({
        title: `Transparent Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        description: `Chat bubbles will now appear ${enabled ? 'glassy' : 'solid'}.`,
        action: <Droplets className="h-5 w-5 text-primary" />,
    });
  };
  
  const dialogBgClass = mode === 'light' ? 'bg-background' : 'bg-background';
  const dialogFgClass = mode === 'light' ? 'text-foreground' : 'text-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={cn("sm:max-w-md p-0", dialogBgClass, dialogFgClass)}>
            <DialogHeader className={cn("p-6 pb-4 border-b transition-colors", dialogBgClass)}>
                <DialogTitle className="flex items-center gap-2 text-xl"><Palette/> Appearance</DialogTitle>
                <DialogDescription>
                    Customize the look and feel of the app.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full">
                <div className="px-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <TabsTrigger value="vip" disabled={!hasVipAccess} className="relative">
                                        <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                                        VIP Themes
                                        {!hasVipAccess && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TabsTrigger>
                                </TooltipTrigger>
                                {!hasVipAccess && (
                                    <TooltipContent>
                                        <p>Purchase a VIP plan to unlock exclusive themes.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </TabsList>
                </div>
                
                <TabsContent value="general" className="p-6 pt-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Mode</Label>
                            <div className="grid grid-cols-2 gap-3">
                               <ModeCard 
                                    mode="light"
                                    label="Light"
                                    icon={<Sun/>}
                                    selectedMode={mode}
                                    onClick={() => setMode('light')}
                                    theme={theme}
                               />
                               <ModeCard 
                                    mode="dark"
                                    label="Dark"
                                    icon={<Moon/>}
                                    selectedMode={mode}
                                    onClick={() => setMode('dark')}
                                    theme={theme}
                               />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Color Theme</Label>
                             <div className="flex items-center gap-3">
                                {generalThemes.map((t) => (
                                    <TooltipProvider key={t.name}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setTheme(t.name)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                                                        theme === t.name ? 'ring-primary' : 'ring-transparent hover:ring-primary/50'
                                                    )}
                                                >
                                                    <div className={cn("h-8 w-8 rounded-full", t.color)} />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Effects</Label>
                            <TransparentModeCard
                                mode={mode}
                                theme={theme}
                                isEnabled={transparentMode}
                                onClick={() => handleTransparentModeChange(!transparentMode)}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="vip" className="p-6 pt-4">
                     <div className="space-y-2">
                        <Label>Exclusive VIP Themes</Label>
                         <div className="grid grid-cols-3 gap-2">
                            {vipThemes.map((t) => {
                                const Icon = t.icon;
                                return (
                                <TooltipProvider key={t.name}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setTheme(t.name)}
                                                className={cn(
                                                    "h-16 w-full rounded-md flex flex-col items-center justify-center ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                                                    theme === t.name ? 'ring-primary' : 'ring-transparent hover:ring-primary/50'
                                                )}
                                            >
                                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white", t.color)}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )})}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="p-6 pt-2 border-t">
                <DialogClose asChild>
                    <Button type="button" className="w-full">Done</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

    
