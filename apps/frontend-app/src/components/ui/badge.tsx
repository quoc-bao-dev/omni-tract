import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClass: Record<BadgeTone, string> = {
  success: 'bg-success text-white',
  warning: 'bg-warning text-ink',
  danger: 'bg-danger text-white',
  neutral: 'bg-ink text-on-ink',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Badge nhỏ pill (Figma Badge/Small): rounded-full, px-1.5 py-0.5, 12/Medium. */
export function Badge({ tone = 'neutral', children, icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-xs',
        toneClass[tone],
        className,
      )}
    >
      {icon ? (
        <span className="flex size-3 items-center justify-center">{icon}</span>
      ) : (
        <span
          className="size-1.5 rounded-full bg-current opacity-90"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
