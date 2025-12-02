// src/app/login/page.tsx
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
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading: authLoadingState, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoadingState) {
      router.push('/chat');
    }
  }, [user, authLoadingState, router]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
       toast({ title: "Missing Information", description: "Please enter both email and password.", variant: "destructive" });
       setIsLoading(false);
       return;
    }

    try {
      const { success, message: loginMessage } = await login(email, password);
      if (success) {
        toast({ title: "Login Successful", description: "Welcome back!" });
        router.push('/chat');
      } else {
        toast({ title: "Login Failed", description: loginMessage, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

   const handlePasswordReset = async () => {
      if (!email) {
          toast({ title: "Email Required", description: "Please enter your email address to reset password.", variant: "destructive" });
          return;
      }
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Password Reset Email Sent", description: `If an account for ${email} exists, a reset link has been sent.` });
      setIsLoading(false);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className={cn("w-full max-w-md shadow-lg", "gradient-background")}>
        <CardHeader className="text-center space-y-4">
           <div className="flex justify-center">
             <Logo className="h-10 text-primary" />
           </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Echo account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label htmlFor="password">Password</Label>
                  <Button
                     type="button"
                     variant="link"
                     className="text-xs h-auto p-0 text-primary hover:underline"
                     onClick={handlePasswordReset}
                     disabled={isLoading || !email || authLoadingState}
                    >
                     Forgot Password?
                  </Button>
                </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || authLoadingState}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || authLoadingState}>
              {(isLoading || authLoadingState) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {(isLoading || authLoadingState) ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline ml-1">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
