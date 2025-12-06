
// src/app/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MailCheck, Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function VerifyEmailPage() {
  const { user, loading, logout, sendVerificationEmail, reloadUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is verified, logged out, or still loading
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.emailVerified) {
        router.replace('/chat');
      }
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    setError(null);
    try {
      await sendVerificationEmail();
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox (and spam folder).',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to send verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleManualCheck = async () => {
    await reloadUser();
    // The useEffect will handle redirection if the user is now verified.
    toast({ title: 'Status Checked', description: 'Checking for email verification status...'});
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading || !user || user.emailVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-auth-gradient p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <MailCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            A verification link has been sent to your email address:
            <br />
            <strong className="text-foreground">{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            {error && (
                <p className="text-destructive text-sm font-semibold flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4 shrink-0"/> {error}
                </p>
            )}
          <p className="text-sm text-muted-foreground">
            Please click the link in that email to continue. You can close this tab after verifying.
          </p>

           <Button onClick={handleManualCheck} className="w-full">
            I've Verified My Email
          </Button>

          <div className="text-sm text-muted-foreground">
            Didn't receive an email?
            <Button
              variant="link"
              className="px-1"
              onClick={handleResendVerification}
              disabled={isSending}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend link'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
           <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
