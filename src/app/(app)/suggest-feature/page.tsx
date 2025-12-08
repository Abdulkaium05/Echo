
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Lightbulb, Loader2, Upload, Image as ImageIcon, Link2, Check } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { submitFeatureSuggestion } from '@/services/firestore';
import { uploadAvatar } from '@/services/storage'; // Re-using avatar upload for general images

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must be 2000 characters or less'),
  imageUrl: z.string().url('Invalid image data').optional(),
  linkUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
}).refine(data => {
    // If there is no imageUrl, there must be a linkUrl.
    if (!data.imageUrl && !data.linkUrl) {
        return false;
    }
    return true;
}, {
    // This message will be displayed if the refinement fails.
    // It's a pathless error, applying to the whole form.
    // We can target a specific field if we want.
    message: "You must provide either an image or a URL for your suggestion.",
    path: ["linkUrl"], // Show the error under the linkUrl field for better UX.
});


type FeatureSuggestionForm = z.infer<typeof formSchema>;

export default function SuggestFeaturePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, storage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FeatureSuggestionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: undefined,
      linkUrl: '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image smaller than 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue('imageUrl', result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<FeatureSuggestionForm> = async (data) => {
    if (!user || !userProfile) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to submit a suggestion.', variant: 'destructive' });
      return;
    }
    if (!storage) {
        toast({ title: 'Storage Error', description: 'Storage service not available.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);

    try {
      let uploadedImageUrl = '';
      // If there's an image to upload (it will be a data URI)
      if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
        // We reuse the avatar upload function, but the path will be different
        uploadedImageUrl = await uploadAvatar(storage, user.uid, data.imageUrl);
      }

      await submitFeatureSuggestion({
        ...data,
        imageUrl: uploadedImageUrl, // Use the final URL
        suggesterUid: user.uid,
        suggesterName: userProfile.name,
      });

      toast({
        title: 'Suggestion Submitted!',
        description: "Thank you! We've received your idea and will review it soon.",
        action: <Check className="h-5 w-5 text-green-500" />
      });
      router.push('/chat');

    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      toast({ title: 'Submission Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Lightbulb className="h-7 w-7 text-primary" />
            Suggest a New Feature
          </CardTitle>
          <CardDescription>
            Have a great idea? Share it with us! If we implement your feature, you'll earn an exclusive Creator badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idea Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Animated Reactions for Messages'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your feature in detail. How would it work? Why would it be useful?" {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Optional Image</FormLabel>
                <FormControl>
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload a Mockup or Example Image
                    </Button>
                  </div>
                </FormControl>
                {imagePreview && (
                  <div className="mt-2 relative w-32 h-32">
                    <img src={imagePreview} alt="Image preview" className="rounded-md object-cover w-full h-full" />
                  </div>
                )}
              </FormItem>

              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Link</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="https://example.com/reference" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : 'Submit My Idea'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
