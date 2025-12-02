// src/app/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2, AlertTriangle, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup, loading: authLoadingState, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in, redirect them.
    // This could happen if they manually navigate to /signup.
    if (user && !authLoadingState) {
      router.push('/chat');
    }
  }, [user, authLoadingState, router]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(null);
    setIsLoading(true);

    if (!email || !password || !confirmPassword) {
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
        toast({ title: "Signup Failed", description: errMsg, variant: "destructive", duration: 7000 });
        setIsLoading(false);
        return;
    }
    
    try {
      const { success, message: signupMessage } = await signup(email, password);

      if (success) {
        toast({
          title: "Account Created!",
          description: "Welcome! Please check your email for verification.",
          action: <MailCheck className="h-5 w-5 text-green-500" />,
          duration: 7000,
        });
        // Redirect to the new welcome page for profile setup
        router.push('/welcome');
      } else {
        setSignupError(signupMessage);
        toast({ title: "Signup Failed", description: signupMessage, variant: "destructive" });
      }
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      const message = error.message || "An unexpected error occurred.";
      setSignupError(message);
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className={cn("w-full max-w-md shadow-lg", "gradient-background")}>
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center">
            <Logo className="h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join Echo today with just your email.</CardDescription>
            {signupError && (
              <p className="text-destructive text-sm font-semibold flex items-center justify-center gap-1 px-4 text-center">
                  <AlertTriangle className="h-4 w-4 shrink-0"/> {signupError}
              </p>
            )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
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
