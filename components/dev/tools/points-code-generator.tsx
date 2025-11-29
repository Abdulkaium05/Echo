
// src/components/dev/tools/points-code-generator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Coins, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPointsPromoCode, getPointsPromoCodes } from '@/services/firestore';

export function PointsCodeGeneratorTab() {
  const { toast } = useToast();

  const [amount, setAmount] = useState(100);
  const [totalUses, setTotalUses] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [canGenerate, setCanGenerate] = useState(true);
  const [cooldown, setCooldown] = useState('');
  const [lastCodeTimestamp, setLastCodeTimestamp] = useState<number | null>(null);

  useEffect(() => {
    getPointsPromoCodes().then(codes => {
      if (codes.length > 0) {
        const lastCode = codes[codes.length - 1];
        setLastCodeTimestamp(lastCode.createdAt);
      }
    });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lastCodeTimestamp) {
        const oneHour = 60 * 60 * 1000;
        const updateCooldown = () => {
            const timeLeft = (lastCodeTimestamp + oneHour) - Date.now();
            if (timeLeft <= 0) {
                setCanGenerate(true);
                setCooldown('');
                if(timer) clearInterval(timer);
            } else {
                setCanGenerate(false);
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCooldown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };
        updateCooldown();
        timer = setInterval(updateCooldown, 1000);
    }
    return () => clearInterval(timer);
  }, [lastCodeTimestamp]);


  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCode(null);
    try {
      const code = await createPointsPromoCode(amount, totalUses);
      setGeneratedCode(code);
      setLastCodeTimestamp(Date.now()); // Update last generated timestamp
      toast({ title: "Points Promo Code Generated!", description: `Code: ${code}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
                <Coins className="h-7 w-7 text-primary" />
                Points Promo Code Generator
            </CardTitle>
            <CardDescription>
                Create redeemable codes for points. You can generate one code per hour.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="points-amount">Points Amount</Label>
                <Input id="points-amount" type="number" value={amount} onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="points-total-uses">Total Uses</Label>
                <Input id="points-total-uses" type="number" value={totalUses} onChange={(e) => setTotalUses(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
            <Button onClick={handleGenerate} disabled={isGenerating || !canGenerate}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate Points Code"}
            </Button>
            {!canGenerate && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Please wait {cooldown} to generate another code.</span>
                </div>
            )}
            {generatedCode && (
                <div className="w-full p-3 bg-secondary rounded-md flex items-center justify-between gap-2">
                    <code className="font-mono text-lg text-primary">{generatedCode}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedCode)}>
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </CardFooter>
    </Card>
  );
}
