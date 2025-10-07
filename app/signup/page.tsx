
// src/app/signup/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MailCheck, Loader2, AlertTriangle, Upload, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { sendWelcomeMessage } from '@/services/firestore';
import { uploadAvatar as mockUploadAvatar } from '@/services/storage';
import { useNotifications } from '@/context/notification-context';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup: mockSignup, loading: authLoadingState, user } = useAuth();
  const { addSystemNotification } = useNotifications();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !authLoadingState) {
      router.push('/chat');
    }
  }, [user, authLoadingState, router]);


  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image file.' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Avatar image must be smaller than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setNewAvatarFile(result);
        toast({ title: "Avatar Selected", description: "Avatar will be uploaded upon signup." });
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error Reading File', description: 'Could not read the selected file.' });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };


  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(null);
    setIsLoading(true);

    if (!username || !email || !password || !confirmPassword) {
        setSignupError("Please fill in all fields.");
        toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      toast({ title: "Signup Failed", description: "Passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        const errMsg = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.";
        setSignupError(errMsg);
        toast({
            title: "Signup Failed",
            description: errMsg,
            variant: "destructive",
            duration: 7000
        });
        setIsLoading(false);
        return;
    }

    let uploadedAvatarUrl: string | undefined = avatarPreview || undefined;
    if (newAvatarFile) {
        try {
            toast({title: "Uploading avatar..."});
            uploadedAvatarUrl = await mockUploadAvatar( 'user-id-placeholder', newAvatarFile, 'image/png');
            toast({ title: "Avatar Uploaded!"});
        } catch (avatarError: any) {
            toast({ title: "Avatar Upload Failed", description: avatarError.message, variant: "destructive" });
            uploadedAvatarUrl = avatarPreview || `https://picsum.photos/seed/${username}/200`;
        }
    }


    try {
      const { success, message: signupMessage, user: signedUpUser, userProfile: signedUpUserProfile } = await mockSignup(username, email, password, uploadedAvatarUrl);

      if (success && signedUpUser && signedUpUserProfile) {
        await sendWelcomeMessage(signedUpUser.uid);
        
        addSystemNotification({
            type: 'welcome',
            title: 'Welcome to Echo!',
            message: `Hi ${signedUpUserProfile.name}, thanks for joining!`,
        });

        // Add the promo code notification
        addSystemNotification({
            type: 'system',
            title: 'Your Welcome Gift! 🎁',
            message: "Here's a promo code for a 7-day Basic VIP plan: REDEEMBASIC7",
        });

        toast({
          title: "Account Created!",
          description: "Welcome! Please check your email for verification.",
          action: <MailCheck className="h-5 w-5 text-green-500" />,
          duration: 10000,
        });
        router.push('/chat');
      } else {
        setSignupError(signupMessage);
        toast({
          title: "Signup Failed",
          description: signupMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      setSignupError(error.message || "An unexpected error occurred.");
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const fallbackInitials = username ? username.substring(0, 2).toUpperCase() : <UserCircle2 className="h-12 w-12 text-muted-foreground" />;


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center">
            <Logo className="h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join Echo Message today!</CardDescription>
            {signupError && (
              <p className="text-destructive text-sm font-semibold flex items-center justify-center gap-1 px-4 text-center">
                  <AlertTriangle className="h-4 w-4 shrink-0"/> {signupError}
              </p>
            )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="flex flex-col items-center space-y-2 mb-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} alt="Avatar Preview" data-ai-hint="user avatar"/>
                <AvatarFallback>{fallbackInitials}</AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isLoading || authLoadingState}/>
              <Button type="button" variant="outline" size="sm" onClick={handleAvatarChangeClick} disabled={isLoading || authLoadingState}>
                <Upload className="mr-2 h-4 w-4" /> Choose Avatar
              </Button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 8 chars, A-Z, a-z, 0-9)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <Button type="submit" className="w-full !mt-6" disabled={isLoading || authLoadingState}>
              {(isLoading || authLoadingState) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {(isLoading || authLoadingState) ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline ml-1">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
