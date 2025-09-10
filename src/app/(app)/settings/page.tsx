// src/app/(app)/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Bell, Lock, Crown, CheckCircle, FileUp, Music, Play, Pause, SkipBack, SkipForward, Loader2, FolderOpen, Trash2, Volume2, ListMusic, PlusCircle, X, ExternalLink } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useVIP } from '@/context/vip-context';
import { Input } from '@/components/ui/input';
import { useMusicPlayer, type SavedSong } from '@/context/music-player-context';
import { useNotifications } from '@/context/notification-context';
import { TrashDialog } from '@/components/settings/trash-dialog'; // Import the new dialog
import { cn } from '@/lib/utils';
import { useSound } from '@/context/sound-context';
import { ScrollArea } from '@/components/ui/scroll-area';

const AudioVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
    return (
        <div className="relative w-24 h-1.5 bg-secondary-foreground/20 rounded-full overflow-hidden">
            <div
                className={cn(
                    'absolute left-0 top-0 h-full bg-primary rounded-full',
                    isPlaying ? 'animate-pulse-wide' : 'w-0'
                )}
            />
            <style jsx>{`
                @keyframes pulse-wide {
                    0% { width: 0%; opacity: 0.7; }
                    50% { width: 100%; opacity: 1; }
                    100% { width: 0%; opacity: 0.7; }
                }
                .animate-pulse-wide {
                    animation: pulse-wide 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

const AddSongDialog = ({ isOpen, onOpenChange, onSave, initialUrl }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (name: string, url: string) => void, initialUrl: string }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setUrl(initialUrl);
        }
    }, [isOpen, initialUrl]);
    
    const handleSave = () => {
        if (name.trim() && url.trim()) {
            onSave(name, url);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Song to Playlist</DialogTitle>
                    <DialogDescription>Save the current URL with a name for easy access.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="song-name">Song Name</Label>
                        <Input id="song-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My Favorite Tune" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="song-url">Song URL</Label>
                        <Input id="song-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/song.mp3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={!name.trim() || !url.trim()}>Save Song</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};


export default function SettingsPage() {
  const { isVIP, vipPack } = useVIP();
  const { toast } = useToast();
  const { addSystemNotification } = useNotifications();
  const { soundEnabled, setSoundEnabled } = useSound();
  
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [showVipDialog, setShowVipDialog] = useState(false);
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false); // State for trash dialog
  
  // State for verification
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // State for music player
  const { url, isPlaying, setUrl, togglePlay, savedSongs, addSong, removeSong } = useMusicPlayer();
  const [urlInput, setUrlInput] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    const song = savedSongs.find(s => s.url === url);
    if (url && song) {
        setUrlInput(song.name);
    } else if (url && !url.startsWith('blob:')) {
        setUrlInput(url);
    } else if (url.startsWith('blob:')) {
        // Keep the file name for blob URLs, which is already handled in handleAudioFileChange
    } else {
        setUrlInput('');
    }
  }, [url, savedSongs]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        toast({ title: "Unsupported Browser", description: "This browser does not support desktop notifications.", variant: "destructive"});
        return;
    }

    if (notificationPermission === 'granted') {
        setNotificationsEnabled(true);
        toast({ title: "Permissions Already Granted", description: "You can already receive notifications." });
        return;
    }

    if (notificationPermission === 'denied') {
        toast({ title: "Permissions Blocked", description: "You have blocked notifications. Please enable them in your browser settings.", variant: "destructive" });
        setNotificationsEnabled(false);
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            setNotificationsEnabled(true);
            toast({ title: "Permissions Granted!", description: "You will now receive notifications.", action: <CheckCircle className="h-5 w-5 text-green-500"/> });
            new Notification("Echo Message", { body: "Notifications are now enabled!" });
        } else {
            setNotificationsEnabled(false);
            toast({ title: "Permissions Denied", description: "You won't receive notifications.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({ title: "Error", description: "Something went wrong while requesting permissions.", variant: "destructive" });
    }
  };


  const handleVerificationApply = async () => {
    if (!documentFile) {
        toast({
            title: "Document Required",
            description: "Please upload an official document to apply.",
            variant: "destructive",
        });
        return;
    }
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    toast({
        title: "Application Submitted",
        description: "Your verification request has been received. We will review it shortly.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />
    });
    
    addSystemNotification({
        type: 'system',
        title: 'Verification Submitted',
        message: 'Your application has been received and will be reviewed by our team.',
    });

    setDocumentFile(null);
    setIsApplying(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    const matchedSong = savedSongs.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
    setUrl(matchedSong ? matchedSong.url : e.target.value);
  };
  
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({ title: 'Invalid File', description: 'Please select an audio file.', variant: 'destructive'});
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      setUrlInput(file.name); // Show file name in the input
      toast({ title: "Music Loaded", description: `Now playing: ${file.name}` });
    }
  };
  
  const sendTestNotification = () => {
      if (notificationsEnabled) {
          addSystemNotification({
              type: 'system',
              title: 'Test Notification',
              message: 'This is a test notification from Echo Message!',
          });
          toast({ title: 'Test Sent', description: 'Check your notifications panel or system alerts.'});
      } else {
          toast({ title: 'Notifications Disabled', description: 'Please enable notifications to receive a test.', variant: 'destructive'});
      }
  }

  const handlePlaySavedSong = (song: SavedSong) => {
    setUrl(song.url);
    toast({ title: "Music Changed", description: `Now playing: ${song.name}`});
  };


  return (
    <>
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6 md:mb-8">
        More Settings
      </h1>

      <div className="grid gap-6 md:gap-8 md:grid-cols-1 lg:grid-cols-2">

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> App Notifications</CardTitle>
            <CardDescription>Receive system notifications for new messages and alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-switch" className="flex-1 mr-2 break-words">Enable Notifications</Label>
              <Switch
                id="notifications-switch"
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                    if (checked) {
                        requestNotificationPermission();
                    } else {
                        setNotificationsEnabled(false);
                        toast({ title: 'Notifications Disabled', description: "You will no longer receive system notifications."});
                    }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
                {notificationPermission === 'denied' 
                    ? "You have blocked notifications. You must enable them in your browser settings to receive alerts." 
                    : "This will show system alerts for new messages."}
            </p>
          </CardContent>
           <CardFooter>
             <Button onClick={sendTestNotification} variant="outline" size="sm" disabled={!notificationsEnabled}>Send Test Notification</Button>
           </CardFooter>
        </Card>

         <Card className="lg:col-span-1">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Account & Security</CardTitle>
             <CardDescription>Manage password, linked accounts, etc.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <Button variant="outline" onClick={() => toast({title: "Feature In Development", description: "Changing password will be available soon."})}>Change Password</Button>
             <Button variant="outline" onClick={() => toast({title: "Feature In Development", description: "Managing linked accounts will be available soon."})}>Manage Linked Accounts</Button>
           </CardContent>
         </Card>

         <Card className="lg:col-span-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" /> VIP Membership</CardTitle>
             <CardDescription>Manage your VIP subscription and benefits.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {isVIP ? (
                <p className="text-sm text-green-600 font-semibold">You are currently a VIP member{vipPack ? ` (${vipPack})` : ''}!</p>
             ) : (
               <p className="text-sm text-muted-foreground">You are not currently a VIP member.</p>
             )}
             <Button onClick={() => setShowVipDialog(true)} variant="outline">
               {isVIP ? 'View VIP Details' : 'Learn about VIP'}
             </Button>
           </CardContent>
         </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Apply for Verification</CardTitle>
            <CardDescription>
              If you are an important or famous person, you can apply for verification by submitting an official document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="document-upload">Official Document</Label>
            <Input
              id="document-upload"
              type="file"
              onChange={(e) => setDocumentFile(e.target.files ? e.target.files[0] : null)}
              accept="image/*,.pdf"
            />
            {documentFile && <p className="text-xs text-muted-foreground">Selected file: {documentFile.name}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleVerificationApply} className="w-full sm:w-auto ml-auto" disabled={!documentFile || isApplying}>
                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isApplying ? 'Submitting...' : 'Apply Now'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5" /> Background Music Player</CardTitle>
            <CardDescription>
              Play music from a URL, local file, or your saved playlist. Music continues playing as you navigate the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="music-url">Media URL or Local File</Label>
              <div className="flex gap-2">
                 <Input
                    id="music-url"
                    placeholder="Enter URL, saved song name, or select a file"
                    value={urlInput}
                    onChange={handleUrlChange}
                    readOnly={url.startsWith('blob:')}
                    list="saved-songs-list"
                 />
                 <datalist id="saved-songs-list">
                    {savedSongs.map(song => (
                        <option key={song.id} value={song.name} />
                    ))}
                 </datalist>
                 <Button variant="outline" size="icon" onClick={() => audioInputRef.current?.click()} aria-label="Open file">
                    <FolderOpen className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" onClick={() => setIsAddSongDialogOpen(true)} aria-label="Add to playlist" disabled={!urlInput || url.startsWith('blob:')}>
                    <PlusCircle className="h-4 w-4"/>
                 </Button>
                 <input type="file" ref={audioInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 p-4 rounded-md bg-secondary">
                <Button variant="ghost" size="icon"><SkipBack className="h-5 w-5" /></Button>
                 <div className="flex flex-col items-center gap-2">
                    <Button variant="default" size="icon" className="h-12 w-12" onClick={togglePlay} disabled={!url}>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                     <AudioVisualizer isPlaying={isPlaying && !!url} />
                </div>
                <Button variant="ghost" size="icon"><SkipForward className="h-5 w-5" /></Button>
            </div>

            {savedSongs.length > 0 && (
                <div className="space-y-2 pt-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><ListMusic className="h-4 w-4"/> Playlist</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-2">
                        <div className="space-y-1">
                            {savedSongs.map(song => (
                                <div key={song.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-secondary">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePlaySavedSong(song)}>
                                        {isPlaying && url === song.url ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" title={song.name}>{song.name}</p>
                                        <p className="text-xs text-muted-foreground truncate" title={song.url}>{song.url}</p>
                                    </div>
                                    <a href={song.url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({variant: "ghost", size: "icon"}), "h-7 w-7")}>
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => removeSong(song.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5" /> Sound Effects</CardTitle>
             <CardDescription>Manage in-app sound effects for a more interactive experience.</CardDescription>
           </CardHeader>
           <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-effects-switch" className="flex-1 mr-2 break-words">Enable Sound Effects</Label>
                  <Switch
                    id="sound-effects-switch"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
           </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" /> Trash</CardTitle>
            <CardDescription>View and restore deleted chats.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Chats moved to the trash will be stored here. You can restore them at any time.</p>
          </CardContent>
          <CardFooter>
             <Button onClick={() => setIsTrashDialogOpen(true)} className="w-full sm:w-auto ml-auto" variant="outline">Open Trash</Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showVipDialog} onOpenChange={setShowVipDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="h-6 w-6 text-yellow-500" /> VIP Information</DialogTitle>
            <DialogDescription>Details about your VIP membership.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isVIP ? (
              <>
                 <p>You are a VIP member!</p>
                 {vipPack && <p>Your current pack is: <span className="font-semibold">{vipPack}</span>.</p>}
              </>
            ) : (
              <p>Become a VIP member to unlock exclusive features and benefits!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    
    <TrashDialog isOpen={isTrashDialogOpen} onOpenChange={setIsTrashDialogOpen} />
    <AddSongDialog 
        isOpen={isAddSongDialogOpen}
        onOpenChange={setIsAddSongDialogOpen}
        onSave={addSong}
        initialUrl={url}
    />
    </>
  );
}
