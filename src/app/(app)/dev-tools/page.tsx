// src/app/dev-tools/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code, Gift, QrCode, History, Coins } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VipCodeGeneratorTab } from '@/components/dev/tools/vip-code-generator';
import { BadgeQrGeneratorTab } from '@/components/dev/tools/badge-qr-generator';
import { PointsCodeGeneratorTab } from '@/components/dev/tools/points-code-generator';
import { CodeHistoryTab } from '@/components/dev/tools/code-history';


export default function DevToolsPage() {
  const { userProfile, loading } = useAuth();

  // Re-enable the check for the dev team user.
  const isDevTeamUser = userProfile?.isDevTeam === true;

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!isDevTeamUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
        <Code className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          This feature is for administrative purposes and is not available.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/chat">
              Go Back to Chats
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Developer Tools
            </h1>
        </div>

        <Tabs defaultValue="promo" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="promo">
                    <Gift className="mr-2 h-4 w-4" />
                    VIP Code
                </TabsTrigger>
                <TabsTrigger value="qr">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                </TabsTrigger>
                 <TabsTrigger value="points">
                    <Coins className="mr-2 h-4 w-4" />
                    Points Code
                </TabsTrigger>
                <TabsTrigger value="history">
                    <History className="mr-2 h-4 w-4" />
                    History
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="promo" className="flex-1 mt-6">
                <VipCodeGeneratorTab />
            </TabsContent>
            <TabsContent value="qr" className="flex-1 mt-6">
                <BadgeQrGeneratorTab />
            </TabsContent>
            <TabsContent value="points" className="flex-1 mt-6">
                <PointsCodeGeneratorTab />
            </TabsContent>
            <TabsContent value="history" className="flex-1 mt-6">
                <CodeHistoryTab />
            </TabsContent>
        </Tabs>
    </div>
  );
}
