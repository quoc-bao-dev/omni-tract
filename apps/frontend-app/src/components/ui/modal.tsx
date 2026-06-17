'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { CloseIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Hàng action ở footer (Figma "Actions"). */
  footer?: ReactNode;
  className?: string;
}

/**
 * Modal/Dialog (Figma 107:3840): overlay 25%, container 600px, rounded-32, shadow, max-h 80vh.
 * Dùng <dialog> native → có sẵn Esc, focus-trap, inert nền.
 */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onBackdropClick(e: MouseEvent) {
      if (e.target === el) onClose(); // click vùng ::backdrop
    }
    function onCancel(e: Event) {
      e.preventDefault(); // Esc
      onClose();
    }
    el.addEventListener('click', onBackdropClick);
    el.addEventListener('cancel', onCancel);
    return () => {
      el.removeEventListener('click', onBackdropClick);
      el.removeEventListener('cancel', onCancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={cn(
        'm-auto w-[600px] max-w-[calc(100vw-2rem)] rounded-2xl p-0',
        'border border-border-hairline bg-surface text-text-primary shadow-modal',
        'backdrop:bg-overlay',
        className,
      )}
    >
      <div className="flex h-[80vh] max-h-[80vh] flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
          <header className="flex items-start justify-between gap-4">
            <h2 className="font-semibold text-h3 text-ink">{title}</h2>
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="grid size-7 shrink-0 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <CloseIcon className="size-5" />
            </button>
          </header>
          {children}
        </div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 px-6 pt-3 pb-6">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
