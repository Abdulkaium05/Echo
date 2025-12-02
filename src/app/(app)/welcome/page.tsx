// src/app/(app)/welcome/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { uploadAvatar } from '@/services/storage';

export default function WelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, updateMockUserProfile, loading, isUserProfileLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>('');
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isUserProfileLoading && userProfile) {
        setUsername(userProfile.name || '');
        setAvatarPreview(userProfile.avatarUrl);
    }
  }, [userProfile, loading, isUserProfileLoading]);

  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image smaller than 2MB.' });
        return;
      }
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      router.push('/login');
      return;
    }
    if (!username.trim()) {
      toast({ title: "Username Required", description: "Please enter a username.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let finalAvatarUrl = userProfile?.avatarUrl;

    try {
      if (newAvatarFile) {
        finalAvatarUrl = await uploadAvatar(user.uid, newAvatarFile, newAvatarFile.type);
        toast({ title: "Avatar Uploaded" });
      }

      await updateMockUserProfile(user.uid, {
        name: username.trim(),
        avatarUrl: finalAvatarUrl,
      });

      toast({
        title: "Profile Saved!",
        description: "Welcome to Echo Message!",
        action: <Check className="h-5 w-5 text-green-500" />
      });
      router.push('/chat');
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast({ title: "Welcome!", description: "You can update your profile later in the settings." });
    router.push('/chat');
  };
  
  if (loading || isUserProfileLoading) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
      )
  }

  const fallbackInitials = username.substring(0, 2).toUpperCase() || <UserIcon className="h-12 w-12 text-muted-foreground" />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md gradient-background">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Echo!</CardTitle>
          <CardDescription>Let's set up your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} alt="Avatar Preview" data-ai-hint="user avatar"/>
              <AvatarFallback>{fallbackInitials}</AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={handleAvatarChangeClick} disabled={isLoading}>
              <Upload className="mr-2 h-4 w-4" /> Choose Avatar
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button onClick={handleSaveProfile} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save and Continue'}
          </Button>
          <Button variant="link" className="text-sm" onClick={handleSkip} disabled={isLoading}>
            Skip for now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
