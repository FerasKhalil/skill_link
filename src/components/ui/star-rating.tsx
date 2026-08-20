'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, maxRating = 5, size = 'md', interactive = false, onChange, showValue, className }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const displayRating = hoverRating || rating;
  
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.floor(displayRating);
        const halfFilled = !filled && i < displayRating;
        
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              'relative',
              interactive && 'cursor-pointer hover:scale-110 transition-transform',
              !interactive && 'cursor-default'
            )}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHoverRating(i + 1)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              className={cn(
                sizes[size],
                filled ? 'fill-amber-400 text-amber-400' : halfFilled ? 'fill-amber-400/50 text-amber-400' : 'fill-slate-200 text-slate-200'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className={cn('font-medium text-slate-700', size === 'sm' ? 'text-xs ml-1' : 'text-sm ml-1.5')}>
          {(rating ?? 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}
