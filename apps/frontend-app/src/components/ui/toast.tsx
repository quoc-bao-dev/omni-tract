'use client';

import { AlertTriangleIcon, CheckIcon, CloseIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { type ToastTone, useToastStore } from '@/stores/toast-store';

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'bg-[#3fab53]',
  error: 'bg-[#d03e19]',
};

const TONE_ICON: Record<ToastTone, typeof CheckIcon> = {
  success: CheckIcon,
  error: AlertTriangleIcon,
};

/** Vùng hiển thị toast (Figma 156:15946) — cố định đáy giữa màn hình, xếp chồng. */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = TONE_ICON[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-3 text-white shadow-lg',
              TONE_CLASS[t.tone],
            )}
          >
            <Icon className="size-5 shrink-0" />
            <p className="font-medium text-sm">{t.message}</p>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="ml-1 inline-flex h-8 items-center rounded-full bg-surface px-3 font-semibold text-ink text-sm hover:opacity-90"
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => dismiss(t.id)}
              className="ml-1 inline-flex size-5 items-center justify-center opacity-90 hover:opacity-100"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
