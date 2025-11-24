// src/app/login/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading: authLoading, user } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/chat');
    }
  }, [user, authLoading, router]);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    const { email, password } = form;
    if (!email || !password) {
      return toast({
        title: "Missing Information",
        description: "Please fill out both fields.",
        variant: "destructive",
      });
    }

    setIsLoading(true);

    try {
      const { success, message } = await login(email, password);

      if (success) {
        toast({ title: "Welcome Back!", description: "Logged in successfully." });
        router.push('/chat');
      } else {
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message || "Unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!form.email) {
      return toast({
        title: "Email Required",
        description: "Enter your email to receive a reset link.",
        variant: "destructive",
      });
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000)); // mock API
    toast({
      title: "Password Reset Sent",
      description: `If ${form.email} exists, you'll receive a link shortly.`,
    });
    setIsLoading(false);
  };

  const disabled = isLoading || authLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo className="h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Echo Message account.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                disabled={disabled}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>

                <Button
                  type="button"
                  variant="link"
                  className="text-xs p-0 h-auto text-primary hover:underline"
                  disabled={!form.email || disabled}
                  onClick={handlePasswordReset}
                >
                  Forgot Password?
                </Button>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                disabled={disabled}
                required
              />
            </div>

            {/* Login Button */}
            <Button className="w-full" type="submit" disabled={disabled}>
              {disabled ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline ml-1">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
