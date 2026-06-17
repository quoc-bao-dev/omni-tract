import { cn } from '@/lib/utils/cn';

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  name: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Radio group (Figma 107:4640): mark 16, selected = ink + dot trắng.
 * Input native style trực tiếp bằng appearance-none (không dùng sr-only absolute → tránh vỡ layout).
 */
export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
}: RadioGroupProps<T>) {
  return (
    <div className={cn('flex gap-6', className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
            className={cn(
              'size-4 shrink-0 appearance-none rounded-full border border-border-subtle bg-surface',
              'checked:border-ink checked:bg-ink',
              'checked:bg-[radial-gradient(circle,white_0,white_3px,transparent_3px)]',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
            )}
          />
          <span className="text-ink text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
