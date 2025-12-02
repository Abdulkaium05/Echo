
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
} from "@/components/ui/dialog";
import { Moon, Sun, Droplets } from "lucide-react";
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';

interface AppearanceSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'light' | 'dark';
type Theme = 'theme-sky-blue' | 'theme-light-green';

export function AppearanceSettingsDialog({ isOpen, onOpenChange }: AppearanceSettingsDialogProps) {
  const [mode, setMode] = useState<Mode>('light');
  const [theme, setTheme] = useState<Theme>('theme-sky-blue');
  const [transparentMode, setTransparentMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedMode = localStorage.getItem('theme_mode') as Mode | null;
    const savedTheme = localStorage.getItem('theme_color') as Theme | null;
    const savedTransparentMode = localStorage.getItem('transparent_mode') === 'true';

    setMode(savedMode || 'light');
    setTheme(savedTheme || 'theme-sky-blue');
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
    root.classList.remove('theme-sky-blue', 'theme-light-green');
    root.classList.add(theme);
    localStorage.setItem('theme_color', theme);
  }, [theme, isClient]);
  
  useEffect(() => {
    if (!isClient) return;
    const root = window.document.documentElement;
    root.classList.toggle('transparent-mode', transparentMode);
    localStorage.setItem('transparent_mode', String(transparentMode));
  }, [transparentMode, isClient]);

  const handleModeChange = (newMode: Mode) => {
    if (mode !== newMode) {
      setMode(newMode);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    if (theme !== newTheme) {
      setTheme(newTheme);
    }
  };

  const themeColorClass = theme === 'theme-sky-blue' ? 'bg-[hsl(200,100%,50%)]' : 'bg-[hsl(130,65%,55%)]';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Customize the look and feel of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <Card 
                    className={cn(
                        "p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                        mode === 'light' ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => handleModeChange('light')}
                >
                     <div className="w-full h-16 rounded-md bg-white border flex flex-col gap-1 p-2">
                        <div className="w-3/5 h-3 rounded-md bg-muted self-start"></div>
                        <div className={cn("w-4/5 h-4 rounded-md self-end", themeColorClass)}></div>
                        <div className="w-3/5 h-3 rounded-md bg-muted self-start"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4"/>
                        <span className="text-sm font-medium">Light</span>
                    </div>
                </Card>
                 <Card 
                    className={cn(
                        "p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                        mode === 'dark' ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => handleModeChange('dark')}
                >
                     <div className="w-full h-16 rounded-md bg-gray-900 border border-gray-700 flex flex-col gap-1 p-2">
                        <div className="w-3/5 h-3 rounded-md bg-gray-700 self-start"></div>
                        <div className={cn("w-4/5 h-4 rounded-md self-end", themeColorClass)}></div>
                        <div className="w-3/5 h-3 rounded-md bg-gray-700 self-start"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4"/>
                        <span className="text-sm font-medium">Dark</span>
                    </div>
                </Card>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleThemeChange('theme-sky-blue')}>
                        <div className={cn("h-8 w-8 rounded-full border-2 transition-all", theme === 'theme-sky-blue' ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-muted')}>
                            <div className="w-full h-full rounded-full bg-[hsl(200,100%,50%)]"></div>
                        </div>
                        <span className="text-sm font-medium">Sky Blue</span>
                    </div>
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleThemeChange('theme-light-green')}>
                        <div className={cn("h-8 w-8 rounded-full border-2 transition-all", theme === 'theme-light-green' ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-muted')}>
                            <div className="w-full h-full rounded-full bg-[hsl(130,65%,55%)]"></div>
                        </div>
                        <span className="text-sm font-medium">Light Green</span>
                    </div>
                </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
                <Label>Effects</Label>
                 <Card 
                    className={cn(
                        "p-4 flex items-start gap-4 cursor-pointer transition-all relative overflow-hidden",
                        transparentMode ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => setTransparentMode(!transparentMode)}
                >
                    <div className={cn(
                        "absolute top-2 right-2 w-16 h-10 rounded-lg flex items-center justify-center transition-all",
                        transparentMode ? "bg-primary/10" : "bg-muted"
                    )}>
                        <div className={cn(
                            "w-10 h-6 rounded-2xl border transition-all",
                            transparentMode
                                ? "bg-primary/20 border-primary/50 backdrop-blur-sm shadow-inner"
                                : "bg-background border-border"
                        )}>
                        </div>
                         {transparentMode && <div className="absolute w-10 h-6 rounded-2xl bg-primary/20 animate-pulse"></div>}
                    </div>
                    
                    <Droplets className="h-5 w-5 text-primary mt-1 shrink-0"/>
                    <div className="flex-1 pr-16">
                        <Label className="font-semibold cursor-pointer">Transparent Mode</Label>
                        <p className="text-xs text-muted-foreground">Enable a glassy, blurred effect on chat bubbles.</p>
                    </div>
                </Card>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
