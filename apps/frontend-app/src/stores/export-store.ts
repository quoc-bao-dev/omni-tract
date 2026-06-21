import type { ExportFormat } from '@omni/sdk';
import { create } from 'zustand';

const STORAGE_KEY = 'omni-tract:export-format';
const DEFAULT_FORMAT: ExportFormat = 'xlsx';
const VALID: ExportFormat[] = ['xlsx', 'csv', 'pdf'];

function load(): ExportFormat {
  if (typeof window === 'undefined') return DEFAULT_FORMAT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) as ExportFormat | null;
    return raw && VALID.includes(raw) ? raw : DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}

function persist(f: ExportFormat): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, f);
  } catch {
    // localStorage đầy/chặn → bỏ qua, vẫn giữ state trong phiên.
  }
}

interface ExportStore {
  format: ExportFormat;
  /** Đã nạp từ localStorage chưa (tránh đọc localStorage trong initializer → lệch SSR). */
  hydrated: boolean;
  hydrate: () => void;
  setFormat: (f: ExportFormat) => void;
}

/** Định dạng export đã chọn ở Settings — chia sẻ với nút Export, lưu localStorage. */
export const useExportStore = create<ExportStore>((set, get) => ({
  format: DEFAULT_FORMAT,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ format: load(), hydrated: true });
  },
  setFormat: (f) => {
    persist(f);
    set({ format: f });
  },
}));
