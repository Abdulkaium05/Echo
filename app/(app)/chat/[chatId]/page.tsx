
// src/app/(app)/chat/[chatId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';
import { getUserProfile, findChatBetweenUsers, type Chat as ChatType } from '@/services/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/context/auth-context';

interface ChatPartnerDetails {
    id: string; 
    partnerActualId: string; 
    name: string;
    avatarUrl?: string;
    iconIdentifier?: 'dev-team-svg'; 
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
      console.log(`IndividualChatPage: Fetching details for chat ${chatId}, user ${currentUser.uid}`);
      
      const existingChatId = await findChatBetweenUsers(currentUser.uid, chatId);

      let partnerId: string | undefined = undefined;
      const { mockChats } = await import('@/services/firestore'); 
      const chatDoc = mockChats.find(c => (c.id === chatId || c.id === existingChatId) && c.participants.includes(currentUser.uid));

      if (!chatDoc) {
        const potentialPartnerProfile = await getUserProfile(chatId);
        if (potentialPartnerProfile && potentialPartnerProfile.uid !== currentUser.uid) {
            partnerId = potentialPartnerProfile.uid;
            console.log(`Interpreting chatId ${chatId} as direct partner ID.`);
        } else {
            throw new Error("Chat not found or you're not a participant.");
        }

      } else {
          partnerId = chatDoc.participants.find(id => id !== currentUser.uid);
      }


      if (!partnerId) {
        throw new Error("Could not identify the chat partner for this chat.");
      }

      const partnerProfile = await getUserProfile(partnerId);

      if (!partnerProfile) {
        console.warn(`IndividualChatPage: Profile not found for partner ID: ${partnerId}`);
        setChatPartnerDetails({
          id: chatDoc?.id || chatId, 
          partnerActualId: partnerId, 
          name: 'User Not Found',
          isVerified: false,
          isVIP: false,
          isCreator: false,
        });
      } else {
        setChatPartnerDetails({
          id: chatDoc?.id || chatId,
          partnerActualId: partnerProfile.uid,
          name: partnerProfile.name || 'User',
          avatarUrl: partnerProfile.avatarUrl, 
          iconIdentifier: partnerProfile.avatarUrl === 'dev-team-svg-placeholder' ? 'dev-team-svg' : undefined,
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
        console.warn("IndividualChatPage: No authenticated user. Redirecting to login.");
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
       chatIconIdentifier={chatPartnerDetails.iconIdentifier} 
       isVerified={chatPartnerDetails.isVerified} // General verified status for other logic
       isVIP={chatPartnerDetails.isVIP} 
       isCreator={chatPartnerDetails.isCreator} // Pass creator status for badge display
     />
    </div>
  );
}
