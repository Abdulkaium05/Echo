// src/components/rating-stars.tsx
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  count?: number;
  rating: number;
  onRatingChange?: (newRating: number) => void;
  className?: string;
  size?: number;
}

export function RatingStars({
  count = 5,
  rating,
  onRatingChange,
  className,
  size = 24,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseMove = (index: number) => {
    if (onRatingChange) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (onRatingChange) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const effectiveRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", onRatingChange && 'cursor-pointer', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Star
          key={index}
          size={size}
          className={cn(
            "transition-colors",
            effectiveRating > index ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600",
          )}
          onMouseMove={() => handleMouseMove(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
}
