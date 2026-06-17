import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Checkbox Medium (Figma Checkbox/Size/Medium 16): rounded-4, border subtle. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-4 cursor-pointer appearance-none rounded-sm border border-border-subtle bg-surface',
        'checked:border-ink checked:bg-ink',
        'bg-[length:12px_12px] bg-center bg-no-repeat',
        "checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m5%2012%204%204%2010-10%22/%3E%3C/svg%3E')]",
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    />
  );
}
