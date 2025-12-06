// src/components/dev/tools/new-users-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNewestUsers } from '@/services/firestore';
import type { UserProfile } from '@/types/user';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserProfileDialog } from '@/components/profile/user-profile-dialog';
import { Button } from '@/components/ui/button';

export function NewUsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const newestUsers = await getNewestUsers(25);
        setUsers(newestUsers);
      } catch (error: any) {
        toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const handleCopyId = (e: React.MouseEvent, displayUid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayUid);
    toast({ title: "Copied!", description: "User ID copied to clipboard." });
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Users className="h-7 w-7 text-primary" />
            Recent Signups
          </CardTitle>
          <CardDescription>
            Here are the 25 most recently created user accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>No new users found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center gap-4 p-2 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {formatDate(user.createdAt)}
                    </p>
                  </div>
                   {user.displayUid && (
                     <Button variant="ghost" size="sm" onClick={(e) => handleCopyId(e, user.displayUid!)}>
                       <Copy className="mr-2 h-4 w-4" />
                       {user.displayUid}
                     </Button>
                   )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserProfileDialog
        isOpen={!!selectedUser}
        onOpenChange={(open) => { if (!open) setSelectedUser(null); }}
        profile={selectedUser}
      />
    </>
  );
}
