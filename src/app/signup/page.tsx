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
import { MailCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup, loading: authLoadingState, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    // The presence of the user object is enough to trigger redirection.
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);


  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(null);
    setIsLoading(true);

    if (!email || !password) {
        setSignupError("Please fill in all fields.");
        toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
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

    try {
      const { success, message: signupMessage, user: signedUpUser, userProfile: signedUpUserProfile } = await signup(email, password);

      if (success && signedUpUser && signedUpUserProfile) {
        
        toast({
            title: `Welcome to Echo, ${signedUpUserProfile.name}!`,
            description: "Here's a promo code for a 7-day Basic VIP plan: REDEEMBASIC7",
            duration: 10000,
        });

        toast({
          title: "Account Created!",
          description: "Welcome! Please check your email for verification.",
          action: <MailCheck className="h-5 w-5 text-green-500" />,
          duration: 10000,
        });
        // The useEffect will now handle the redirection.
        // router.push('/chat');
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
          <form onSubmit={handleSignup} className="space-y-4">
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
