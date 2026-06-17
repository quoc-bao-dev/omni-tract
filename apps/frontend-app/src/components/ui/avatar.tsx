import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt = '', fallback, size = 32, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-on-ink',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span className="font-semibold text-xs">{fallback}</span>
      )}
    </span>
  );
}
