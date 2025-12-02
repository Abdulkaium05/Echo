import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  planName: string;
  price: number;
  points: number;
  durationDays: number;
  features: string[];
  isPopular?: boolean;
  paymentMethod: 'money' | 'points';
  onSubscribe: () => void;
}

export function SubscriptionCard({
  planName,
  price,
  points,
  durationDays,
  features,
  isPopular = false,
  paymentMethod,
  onSubscribe,
}: SubscriptionCardProps) {
  return (
    <Card className={cn(
        "flex flex-col bg-premium-gradient",
        "transition-all hover:scale-105 hover:shadow-xl",
        isPopular ? "border-primary border-2 shadow-lg" : ""
    )}>
      {isPopular && (
        <div className="bg-primary text-primary-foreground text-center py-1 text-xs sm:text-sm font-medium rounded-t-md -mt-px -mx-px">
          Most Popular
        </div>
      )}
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-semibold">{planName}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{durationDays === Infinity ? 'Lifetime access' : `${durationDays} days of VIP access`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 sm:px-6 pb-4">
        <div className="mb-4">
            <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-bold">{points}</span>
                <Coins className="h-7 w-7 text-yellow-500" />
            </div>
          {durationDays !== Infinity && <span className="text-muted-foreground text-xs sm:text-sm"> / {durationDays} days</span>}
        </div>
        <ul className="space-y-1.5 sm:space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-xs sm:text-sm">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary flex-shrink-0" />
              <span className="break-words">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
        <Button className="w-full" onClick={onSubscribe}>
          Buy with Points
        </Button>
      </CardFooter>
    </Card>
  );
}
