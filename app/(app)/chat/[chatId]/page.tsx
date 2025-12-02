// src/app/(app)/chat/[chatId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';
import { findUserByUid, findChatBetweenUsers, type Chat as ChatType } from '@/services/firestore';
import { useAuth } from '@/context/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/context/auth-context';

interface ChatPartnerDetails {
    id: string; 
    partnerActualId: string; 
    name: string;
    avatarUrl?: string;
    isVerified?: boolean;
    isVIP?: boolean; 
    isCreator?: boolean;
}

export default function IndividualChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading, userProfile: currentUserProfile, isUserProfileLoading } = useAuth();
  const chatId = params?.chatId as string;

  const [chatPartnerDetails, setChatPartnerDetails] = useState<ChatPartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatPartner = useCallback(async () => {
    if (!chatId || !currentUser?.uid) {
      setError("Chat ID or User information is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let partnerId: string | undefined = undefined;
      // This is a simplification. In a real app you'd fetch the chat doc.
      // For this demo, we infer the partner from the URL if it's not a known chat id format
      if (chatId.startsWith('chat-')) {
          // This logic is flawed for a real DB. We can't know the participants just from the chat ID.
          // This is a placeholder for a proper fetch. For now, we assume the partner is the other ID.
          // A real implementation would fetch the chat document from firestore.
          // For now, let's just find the user from the URL if it's not a standard chat ID.
          setError("Cannot determine chat partner from chat ID.");
          setLoading(false);
          return;
      } else {
         partnerId = chatId;
      }

      if (!partnerId) {
        throw new Error("Could not identify the chat partner for this chat.");
      }

      const partnerProfile = await findUserByUid(partnerId);

      if (!partnerProfile) {
        throw new Error(`Profile not found for partner ID: ${partnerId}`);
      } else {
        setChatPartnerDetails({
          id: await findChatBetweenUsers(currentUser.uid, partnerProfile.uid) || `new-${partnerProfile.uid}`,
          partnerActualId: partnerProfile.uid,
          name: partnerProfile.name || 'User',
          avatarUrl: partnerProfile.avatarUrl, 
          isVerified: partnerProfile.isVerified,
          isVIP: partnerProfile.isVIP, 
          isCreator: partnerProfile.isCreator,
        });
      }
    } catch (err: any) {
      console.error("IndividualChatPage: Error fetching chat details:", err);
      setError(err.message || "Failed to load chat details.");
      setChatPartnerDetails(null);
    } finally {
      setLoading(false);
    }
  }, [chatId, currentUser?.uid]);


  useEffect(() => {
    if (!authLoading && !isUserProfileLoading && !currentUser) {
        router.push('/login');
        return;
    }
    if (authLoading || isUserProfileLoading) {
        setLoading(true);
        return;
    }
    fetchChatPartner();
  }, [chatId, currentUser, authLoading, isUserProfileLoading, router, fetchChatPartner]);


  if (loading || authLoading || isUserProfileLoading) {
    return (
        <div className="flex flex-col h-full items-center justify-center p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mt-2 text-muted-foreground">Loading Chat...</span>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col h-full items-center justify-center text-destructive p-4 text-center">
            <ShieldAlert className="h-10 w-10 mb-3" />
            <h3 className="text-lg font-semibold">Error Loading Chat</h3>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={() => router.push('/chat')} variant="outline" className="mt-4">
                Back to Chats
            </Button>
        </div>
    );
  }

  if (!chatPartnerDetails) {
    return (
        <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-4 text-center">
             <ShieldAlert className="h-10 w-10 mb-3" />
             <h3 className="text-lg font-semibold">Chat Unavailable</h3>
             <p className="text-sm mt-1">Could not load chat partner details.</p>
              <Button onClick={() => router.push('/chat')} variant="outline" className="mt-4">
                  Back to Chats
              </Button>
        </div>
    );
  }

   if (!currentUser) {
       return (
           <div className="flex h-full items-center justify-center">
               <p className="text-destructive">Authentication error.</p>
           </div>
       );
   }

  return (
    <div className="h-full">
     <ChatWindow
       chatId={chatPartnerDetails.id}
       chatPartnerId={chatPartnerDetails.partnerActualId}
       chatName={chatPartnerDetails.name}
       chatAvatarUrl={chatPartnerDetails.avatarUrl} 
       isVerified={chatPartnerDetails.isVerified}
       isVIP={chatPartnerDetails.isVIP} 
       isCreator={chatPartnerDetails.isCreator}
     />
    </div>
  );
}
