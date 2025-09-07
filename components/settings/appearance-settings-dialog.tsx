
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
import { Check, Moon, Sun, Palette, Droplets } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

interface AppearanceSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'light' | 'dark';
type Theme = 'theme-sky-blue' | 'theme-light-green';

export function AppearanceSettingsDialog({ isOpen, onOpenChange }: AppearanceSettingsDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('light');
  const [theme, setTheme] = useState<Theme>('theme-sky-blue');
  const [transparentMode, setTransparentMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedMode = localStorage.getItem('theme_mode') as Mode | null;
    const savedTheme = localStorage.getItem('theme_color') as Theme | null;
    const savedTransparentMode = localStorage.getItem('transparent_mode') === 'true';

    const initialMode = savedMode || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    root.classList.remove('theme-sky-blue', 'theme-light-green');
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


  const handleModeChange = (newMode: Mode) => {
    if (mode !== newMode) {
      setMode(newMode);
      toast({
        title: `Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode`,
        action: <Check className="h-5 w-5 text-green-500" />,
      });
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    if (theme !== newTheme) {
      setTheme(newTheme);
      toast({
        title: `Theme changed to ${newTheme === 'theme-light-green' ? 'Light Green' : 'Sky Blue'}`,
        action: <Palette className="h-5 w-5 text-green-500" />,
      });
    }
  };

  const handleTransparentModeChange = (enabled: boolean) => {
    setTransparentMode(enabled);
    toast({
        title: `Transparent Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        description: `Chat bubbles will now appear ${enabled ? 'glassy' : 'solid'}.`,
        action: <Droplets className="h-5 w-5 text-primary" />,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Customize the look and feel of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <p className="text-sm text-muted-foreground">
              Select a light or dark theme for the interface.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant={mode === 'light' ? 'default' : 'outline'}
                onClick={() => handleModeChange('light')}
                disabled={!isClient}
              >
                <Sun className="mr-2 h-4 w-4" /> Light
              </Button>
              <Button
                variant={mode === 'dark' ? 'default' : 'outline'}
                onClick={() => handleModeChange('dark')}
                disabled={!isClient}
              >
                <Moon className="mr-2 h-4 w-4" /> Dark
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Color Theme</Label>
             <p className="text-sm text-muted-foreground">
              Choose your favorite primary color for the app.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant={theme === 'theme-sky-blue' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('theme-sky-blue')}
                disabled={!isClient}
              >
                <div className="mr-2 h-4 w-4 rounded-full bg-[hsl(200,100%,50%)] border border-border" />
                Sky Blue
              </Button>
              <Button
                variant={theme === 'theme-light-green' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('theme-light-green')}
                disabled={!isClient}
              >
                <div className="mr-2 h-4 w-4 rounded-full bg-[hsl(130,65%,55%)] border border-border" />
                Light Green
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
             <Label>Effects</Label>
             <div className="flex items-center justify-between rounded-lg border p-3">
                 <div className="space-y-0.5">
                    <Label htmlFor="transparent-mode-switch">Transparent Mode</Label>
                    <p className="text-xs text-muted-foreground">
                        Enable a glassy, blurred effect on chat bubbles.
                    </p>
                 </div>
                 <Switch
                    id="transparent-mode-switch"
                    checked={transparentMode}
                    onCheckedChange={handleTransparentModeChange}
                    disabled={!isClient}
                 />
             </div>
          </div>

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
