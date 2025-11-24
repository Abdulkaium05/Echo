
// src/app/(app)/poll/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getVerifiedUsers, type UserProfile } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserMultiSelect } from '@/components/poll/multi-select-users';

export default function PollPage() {
  const { userProfile, loading } = useAuth();
  const { toast } = useToast();

  const [question, setQuestion] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<UserProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (userProfile?.isDevTeam) {
      getVerifiedUsers()
        .then(setVerifiedUsers)
        .finally(() => setIsLoadingUsers(false));
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 5) {
      toast({ title: 'Question too short', description: 'Your poll question must be at least 5 characters long.', variant: 'destructive' });
      return;
    }
    if (selectedUsers.length < 2 || selectedUsers.length > 4) {
      toast({ title: 'Invalid Selection', description: 'Please select between 2 and 4 users for the poll.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    console.log("Creating poll:", { question, users: selectedUsers.map(u => u.name) });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
        title: "Poll Created!",
        description: "Your poll has been successfully submitted.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
    });

    // Reset form
    setQuestion('');
    setSelectedUsers([]);
    setIsSubmitting(false);
  };
  
  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!userProfile?.isDevTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
        <BarChart className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          This feature is only available to members of the Dev Team.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/chat">
              Go Back to Chats
          </Link>
        </Button>
      </div>
    );
  }

  const isSubmitDisabled = isSubmitting || !question.trim() || selectedUsers.length < 2 || selectedUsers.length > 4 || isLoadingUsers;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <BarChart className="h-7 w-7 text-primary" />
            Create a New Poll
          </CardTitle>
          <CardDescription>
            Select 2 to 4 verified users and ask a question to the community.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="poll-question">Poll Question</Label>
                <Input
                  id="poll-question"
                  placeholder='e.g., "Who is the best at making memes?"'
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Select Users (2-4)</Label>
                 {isLoadingUsers ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Loading users...</span>
                    </div>
                ) : (
                    <UserMultiSelect
                        users={verifiedUsers}
                        selectedUsers={selectedUsers}
                        onSelectedUsersChange={setSelectedUsers}
                        maxSelection={4}
                    />
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
              </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
