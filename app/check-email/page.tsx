// src/app/check-email/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function CheckEmailPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-auth-gradient p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <MailCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            A password reset link has been sent to the email address you provided, if it exists in our system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please click the link in that email to create a new password. You can close this tab.
          </p>
        </CardContent>
        <CardFooter>
           <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
            Back to Login
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
