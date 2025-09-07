// src/app/(app)/rate-report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getRatings,
  addRating,
  addDevReply,
  type AppRating,
  type UserProfile,
} from '@/services/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RatingStars } from '@/components/rating-stars';
import { Loader2, Send, Upload, Star, MessageSquare, AlertTriangle, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RateReportPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Ratings State
  const [ratings, setRatings] = useState<AppRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Bug Report State
  const [bugDescription, setBugDescription] = useState('');
  const [bugImage, setBugImage] = useState<File | null>(null);
  const [submittingBug, setSubmittingBug] = useState(false);

  useEffect(() => {
    async function fetchRatings() {
      try {
        const fetchedRatings = await getRatings();
        setRatings(fetchedRatings);
        if (user) {
          const userRating = fetchedRatings.find(r => r.userId === user.uid);
          if (userRating) {
            setMyRating(userRating.rating);
            setMyReview(userRating.review);
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not load ratings.',
          variant: 'destructive',
        });
      } finally {
        setLoadingRatings(false);
      }
    }
    fetchRatings();
  }, [user, toast]);

  const handleRatingSubmit = async () => {
    if (myRating === 0) {
      toast({ title: 'Rating Required', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to leave a review.', variant: 'destructive' });
      return;
    }

    setSubmittingRating(true);
    try {
      await addRating({
        userId: user.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatarUrl,
        rating: myRating,
        review: myReview,
      });
      const updatedRatings = await getRatings();
      setRatings(updatedRatings);
      toast({ title: 'Success', description: 'Thank you for your feedback!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleReplySubmit = async (ratingId: string) => {
    if (!replyText.trim() || !userProfile || !userProfile.isDevTeam) return;

    setSubmittingReply(true);
    try {
        await addDevReply(ratingId, replyText);
        const updatedRatings = await getRatings();
        setRatings(updatedRatings);
        toast({ title: 'Reply Posted' });
        setReplyingTo(null);
        setReplyText('');
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setSubmittingReply(false);
    }
  };

  const handleBugSubmit = async () => {
    if (!bugDescription.trim()) {
      toast({ title: 'Description Required', description: 'Please describe the bug.', variant: 'destructive' });
      return;
    }
    setSubmittingBug(true);
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Bug Report Submitted:', {
      description: bugDescription,
      image: bugImage?.name || 'No image',
      sendTo: 'abdulkaiumiqbel2005@gmail.com',
    });
    setBugDescription('');
    setBugImage(null);
    toast({
      title: 'Bug Report Sent',
      description: 'Thank you for helping us improve Echo Message!',
    });
    setSubmittingBug(false);
  };
  
  const overallRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6 md:mb-8">
        Rate &amp; Report
      </h1>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Rating Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-6 w-6 text-yellow-400"/> Rate Our App</CardTitle>
            <CardDescription>Let us know what you think. Your feedback helps us improve.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating-stars">Your Rating</Label>
              <RatingStars rating={myRating} onRatingChange={setMyRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-text">Your Review (Optional)</Label>
              <Textarea
                id="review-text"
                placeholder="Tell us about your experience..."
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleRatingSubmit} disabled={submittingRating || myRating === 0}>
              {submittingRating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </CardFooter>
        </Card>

        {/* Bug Report Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/> Report a Bug</CardTitle>
            <CardDescription>Encountered an issue? Please let us know.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bug-description">Bug Description</Label>
              <Textarea
                id="bug-description"
                placeholder="Please describe the bug in detail..."
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-image">Screenshot (Optional)</Label>
              <Input
                id="bug-image"
                type="file"
                accept="image/*"
                onChange={(e) => setBugImage(e.target.files ? e.target.files[0] : null)}
              />
               {bugImage && <p className="text-xs text-muted-foreground">Selected file: {bugImage.name}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBugSubmit} variant="destructive" disabled={submittingBug || !bugDescription.trim()}>
              {submittingBug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Report Bug
            </Button>
          </CardFooter>
        </Card>
      </div>

       {/* All Reviews Section */}
        <div className="mt-12">
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Community Reviews</h2>
            <Card className="mb-6">
                <CardContent className="p-4 flex items-center justify-center gap-4">
                    <span className="text-lg font-semibold">Overall Rating</span>
                    <RatingStars rating={overallRating} size={28} />
                    <span className="text-lg font-bold text-muted-foreground">({overallRating.toFixed(1)} / 5)</span>
                </CardContent>
            </Card>

            {loadingRatings ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {ratings.map(rating => (
                        <Card key={rating.id} className="p-4">
                            <div className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={rating.userAvatar} alt={rating.userName} data-ai-hint="user avatar"/>
                                    <AvatarFallback>{rating.userName.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{rating.userName}</p>
                                        <span className="text-xs text-muted-foreground">{new Date(rating.timestamp.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <RatingStars rating={rating.rating} size={16} className="my-1"/>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rating.review}</p>

                                    {userProfile?.isDevTeam && !rating.devReply && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-xs"
                                            onClick={() => setReplyingTo(replyingTo === rating.id ? null : rating.id)}
                                        >
                                            <Reply className="mr-1 h-3 w-3"/> Reply
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {replyingTo === rating.id && (
                                <div className="mt-4 pl-14 space-y-2">
                                    <Textarea 
                                        placeholder={`Replying to ${rating.userName}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleReplySubmit(rating.id)} disabled={submittingReply}>
                                            {submittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Post Reply
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {rating.devReply && (
                                <div className="mt-4 pl-10">
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-secondary/70">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">DT</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">Dev Team <span className="text-xs text-muted-foreground font-normal">response</span></p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rating.devReply}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
