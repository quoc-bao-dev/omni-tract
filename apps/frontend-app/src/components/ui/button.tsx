import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'tertiary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  leadingIcon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink shadow-action',
  tertiary:
    'bg-surface text-ink border border-border-subtle shadow-action backdrop-blur-[20px] hover:bg-surface-alt',
};

/** Button/Main (Figma 33:8524) — size Medium: h-40, px-12 py-10, rounded-8, label 14/SemiBold. */
export function Button({
  variant = 'tertiary',
  leadingIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-0.5 rounded-md px-3 py-2.5',
        'whitespace-nowrap font-semibold text-sm transition-colors',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:opacity-50',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {leadingIcon ? (
        <span className="flex size-5 shrink-0 items-center justify-center">{leadingIcon}</span>
      ) : null}
      {children ? <span className="px-1">{children}</span> : null}
    </button>
  );
}
