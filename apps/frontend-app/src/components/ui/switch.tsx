import { cn } from '@/lib/utils/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
  className?: string;
}

/** Toggle (Figma 91:3472): track 36×20, knob 16; on = ink, off = pale. */
export function Switch({ checked, onChange, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label']}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        checked ? 'bg-ink' : 'bg-input',
        className,
      )}
    >
      <span
        className={cn(
          'size-4 rounded-full bg-white shadow-action transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}
