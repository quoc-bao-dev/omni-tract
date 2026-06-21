'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Phần tử hiển thị trước label (vd avatar tác giả). */
  leading?: ReactNode;
}

interface MultiSelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder: string;
  className?: string;
}

/** Multi-select field + popover menu (Figma 156:10462): checkbox items + Reset/Select all. */
export function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder,
  className,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function toggle(v: T) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const selectedLabel = value.length > 0 ? `${value.length} selected` : placeholder;

  return (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md bg-input px-3 py-2.5 shadow-input',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          open && 'outline-2 outline-ink',
        )}
      >
        <span
          className={cn(
            'flex-1 truncate text-left font-medium text-sm',
            value.length > 0 ? 'text-ink' : 'text-placeholder',
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDownIcon className="size-5 shrink-0 text-text-secondary" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-menu-border bg-surface shadow-menu">
          <ul className="max-h-[368px] overflow-y-auto py-1">
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  className="px-1.5 py-px"
                >
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggle(opt.value)}
                    className="flex w-full items-center gap-2 rounded-md py-2.5 pr-2.5 pl-2 text-left hover:bg-surface-alt"
                  >
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-md border',
                        checked ? 'border-ink bg-ink' : 'border-[#404040] bg-surface',
                      )}
                    >
                      {checked ? <CheckIcon className="size-3.5 text-white" /> : null}
                    </span>
                    {opt.leading}
                    <span className="truncate font-medium text-md text-text-primary">
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-menu-border border-t p-3">
            <MenuButton onClick={() => onChange([])}>Reset</MenuButton>
            <MenuButton onClick={() => onChange(options.map((o) => o.value))}>
              Select all
            </MenuButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[#d4d4d4] bg-surface px-2.5 py-1.5 font-semibold text-sm text-text-secondary shadow-xs hover:bg-surface-alt"
    >
      {children}
    </button>
  );
}
