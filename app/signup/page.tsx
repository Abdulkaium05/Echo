// src/app/signup/page.tsx
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MailCheck, Loader2, AlertTriangle, Upload, UserCircle2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { sendWelcomeMessage } from '@/services/firestore';
import { uploadAvatar as uploadAvatarMock } from '@/services/storage';
import { useNotifications } from '@/context/notification-context';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup, loading: authLoading, user } = useAuth();
  const { addSystemNotification } = useNotifications();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const disabled = isLoading || authLoading;

  // Redirect if logged in
  useEffect(() => {
    if (user && !authLoading) router.push('/chat');
  }, [user, authLoading, router]);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Avatar upload
  const handleAvatarClick = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Select an image." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File Too Large", description: "Max 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarFile(result);
      toast({ title: "Avatar Selected", description: "Will upload during signup." });
    };
    reader.onerror = () =>
      toast({ variant: "destructive", title: "Error", description: "Failed to load image." });

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Validation
  const validateForm = () => {
    const { username, email, password, confirmPassword } = form;

    if (!username || !email || !password || !confirmPassword) {
      return "Please fill in all fields.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!strongPw.test(password)) {
      return "Password must include uppercase, lowercase, number, and be 8+ characters.";
    }

    return null;
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const validationError = validateForm();
    if (validationError) {
      setSignupError(validationError);
      toast({ title: "Signup Failed", description: validationError, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    let avatarUrl: string | undefined = avatarPreview || undefined;

    // Upload avatar
    if (avatarFile) {
      try {
        toast({ title: "Uploading avatar..." });
        avatarUrl = await uploadAvatarMock("user-id-placeholder", avatarFile, "image/png");
        toast({ title: "Avatar Uploaded!" });
      } catch (err: any) {
        toast({ title: "Avatar Upload Failed", description: err.message, variant: "destructive" });
        avatarUrl = avatarPreview || `https://picsum.photos/seed/${form.username}/200`;
      }
    }

    try {
      const res = await signup(form.username, form.email, form.password, avatarUrl);

      if (res.success && res.user && res.userProfile) {
        await sendWelcomeMessage(res.user.uid);

        addSystemNotification({
          type: "welcome",
          title: "Welcome to Echo!",
          message: `Hi ${res.userProfile.name}, thanks for joining!`,
        });

        addSystemNotification({
          type: "system",
          title: "Your Welcome Gift! 🎁",
          message: "Here’s a promo code for a 7-day Basic VIP plan: REDEEMBASIC7",
        });

        toast({
          title: "Account Created!",
          description: "Check your email for verification.",
          action: <MailCheck className="h-5 w-5 text-green-500" />,
          duration: 10000,
        });

        router.push('/chat');
      } else {
        toast({
          title: "Signup Failed",
          description: res.message,
          variant: "destructive",
        });
        setSignupError(res.message);
      }
    } catch (err: any) {
      toast({
        title: "Signup Failed",
        description: err.message || "Unexpected error.",
        variant: "destructive",
      });
      setSignupError(err.message || "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const avatarFallback = form.username
    ? form.username.slice(0, 2).toUpperCase()
    : <UserCircle2 className="h-12 w-12 text-muted-foreground" />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center">
            <Logo className="h-10 text-primary" />
          </div>

          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join Echo Message today</CardDescription>

          {signupError && (
            <p className="text-destructive text-sm font-semibold flex items-center gap-1 justify-center">
              <AlertTriangle className="h-4 w-4" /> {signupError}
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">

            {/* Avatar */}
            <div className="flex flex-col items-center space-y-2 mb-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} alt="Avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>

              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept="image/*"
                disabled={disabled}
                onChange={handleFileChange}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" /> Choose Avatar
              </Button>
            </div>

            {/* Username */}
            <Field
              id="username"
              label="Username"
              value={form.username}
              disabled={disabled}
              placeholder="Choose a username"
              onChange={(v) => updateForm("username", v)}
            />

            {/* Email */}
            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              disabled={disabled}
              placeholder="name@example.com"
              onChange={(v) => updateForm("email", v)}
            />

            {/* Password */}
            <Field
              id="password"
              label="Password"
              type="password"
              value={form.password}
              disabled={disabled}
              placeholder="Strong password (8+ chars, A-Z, a-z, 0-9)"
              onChange={(v) => updateForm("password", v)}
            />

            {/* Confirm Password */}
            <Field
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              disabled={disabled}
              placeholder="Confirm password"
              onChange={(v) => updateForm("confirmPassword", v)}
            />

            <Button type="submit" className="w-full !mt-6" disabled={disabled}>
              {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {disabled ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline ml-1">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

/* Reusable input field */
function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
