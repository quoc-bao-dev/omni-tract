import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  /** Thêm toast; tự ẩn sau `duration` ms (mặc định 5000). Trả về id. */
  show: (toast: Omit<Toast, 'id'>, duration?: number) => string;
  dismiss: (id: string) => void;
}

let seq = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (toast, duration = 5000) => {
    seq += 1;
    const id = `toast_${seq}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, duration),
      );
    }
    return id;
  },
  dismiss: (id) => {
    const t = timers.get(id);
    if (t) {
      clearTimeout(t);
      timers.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
