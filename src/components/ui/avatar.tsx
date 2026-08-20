import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt: string;
  name: string;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, alt, name, size = 'md', className, online }: AvatarProps) {
  const initials = getInitials(name);
  
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={48}
          height={48}
          className={cn('rounded-full object-cover', sizeClasses[size])}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      <div
        className={cn(
          'rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center',
          sizeClasses[size],
          src && 'absolute inset-0 -z-10'
        )}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            online ? 'bg-emerald-500' : 'bg-slate-400',
            size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          )}
        />
      )}
    </div>
  );
}
