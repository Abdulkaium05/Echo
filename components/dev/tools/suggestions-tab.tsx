
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, AlertCircle, Check, Link2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getFeatureSuggestions,
  updateFeatureSuggestionStatus,
  grantCreatorBadge,
  type FeatureSuggestion,
  updateUserProfile,
  logGift,
  getUserProfile,
} from '@/services/firestore';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/auth-context';

export function SuggestionsTab() {
  const { toast } = useToast();
  const { userProfile: devProfile } = useAuth();
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const fetchedSuggestions = await getFeatureSuggestions();
      setSuggestions(fetchedSuggestions);
    } catch (error: any) {
      toast({ title: "Error fetching suggestions", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [toast]);

  const handleApprove = async (suggestion: FeatureSuggestion) => {
    if (!devProfile) {
        toast({ title: "Error", description: "Developer profile not found.", variant: "destructive" });
        return;
    }
    setIsUpdating(suggestion.id);
    try {
        // First, grant the badge and the gift notification flags
        await grantCreatorBadge(suggestion.suggesterUid, devProfile.uid);
        
        // Then, grant the points
        const suggesterProfile = await getUserProfile(suggestion.suggesterUid);
        const currentPoints = suggesterProfile?.points || 0;
        await updateUserProfile(suggestion.suggesterUid, { points: currentPoints + 10000 });

        // Log this as a special gift in the user's gift history
        await logGift({
            senderId: devProfile.uid,
            receiverId: suggestion.suggesterUid,
            giftType: 'feature_suggestion_approved',
            badgeType: 'creator', // The badge that was granted
            pointsAmount: 10000, // The points that were granted
        });

        // Finally, update the status of the suggestion itself
        await updateFeatureSuggestionStatus(suggestion.id, 'approved');

        toast({
            title: "Suggestion Approved!",
            description: `${suggestion.suggesterName} has been granted the Creator badge and 10,000 points.`,
        });

        // Refresh the list to show the new status
        await fetchSuggestions();

    } catch (error: any) {
        toast({ title: "Error approving suggestion", description: error.message, variant: "destructive" });
    } finally {
        setIsUpdating(null);
    }
  };
  
  const statusColors = {
      submitted: 'bg-blue-500',
      approved: 'bg-green-500',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Lightbulb className="h-7 w-7 text-primary" />
          Feature Suggestions
        </CardTitle>
        <CardDescription>
          Review and approve user-submitted feature ideas. Approving an idea grants the user a Creator badge and 10,000 points.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>No suggestions submitted yet.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {suggestions.map((suggestion) => (
              <AccordionItem key={suggestion.id} value={suggestion.id} className="border rounded-lg px-4 bg-secondary/50">
                <AccordionTrigger>
                    <div className="flex-1 text-left flex items-center gap-4">
                        <Badge className={cn("text-white", statusColors[suggestion.status as keyof typeof statusColors])}>
                            {suggestion.status}
                        </Badge>
                        <span className="font-semibold">{suggestion.title}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.description}</p>
                  
                  {suggestion.imageUrl && (
                     <div className="mt-2">
                        <a href={suggestion.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                           <img src={suggestion.imageUrl} alt="Suggestion visual" className="rounded-md max-w-full h-auto max-h-80" />
                        </a>
                    </div>
                  )}

                  {suggestion.linkUrl && (
                     <Button asChild variant="link" className="p-0 h-auto">
                        <a href={suggestion.linkUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Reference Link
                        </a>
                     </Button>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Submitted by {suggestion.suggesterName}
                  </div>
                  
                  {suggestion.status === 'submitted' && (
                    <div className="pt-4 flex justify-end">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" disabled={isUpdating === suggestion.id}>
                                {isUpdating === suggestion.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Approve & Grant Rewards
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Approve this suggestion?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will grant the Creator badge and 10,000 points to {suggestion.suggesterName} and mark this suggestion as approved. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleApprove(suggestion)}>Confirm & Approve</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
