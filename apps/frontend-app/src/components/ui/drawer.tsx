'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Nhãn aria + nội dung bên trái header. */
  title: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Bề rộng panel (px). Mặc định 600. */
  width?: number;
  className?: string;
}

const DURATION = 300;

/**
 * Drawer phải (Figma 79:6034): 600px, full-height, overlay 25%, shadow.
 * Trượt vào/ra từ phải; dùng <dialog> native (Esc, focus-trap, inert nền).
 */
export function Drawer({
  open,
  onClose,
  title,
  header,
  footer,
  children,
  width = 600,
  className,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false); // điều khiển translate (slide)

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      // hiển thị ở vị trí ngoài (translate-x-full) rồi frame sau mới trượt vào
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false); // trượt ra
    const t = setTimeout(() => {
      if (el.open) el.close();
    }, DURATION);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onBackdropClick(e: MouseEvent) {
      if (e.target === el) onClose();
    }
    function onCancel(e: Event) {
      e.preventDefault(); // Esc → chạy animation đóng qua onClose
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
      style={{ width }}
      className={cn(
        'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none max-w-full p-0',
        'bg-surface-alt text-text-primary shadow-drawer backdrop:bg-overlay',
        'transition-transform duration-300 ease-out motion-reduce:transition-none',
        visible ? 'translate-x-0' : 'translate-x-full',
        className,
      )}
    >
      <div className="flex h-dvh flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-border-overlay border-b bg-surface px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">{header}</div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer ? (
          <div className="shrink-0 border-border-subtle border-t bg-surface-alt px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
