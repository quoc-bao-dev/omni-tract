import { create } from 'zustand';
import { ALL_FIELD_KEYS, type ExportFieldKey } from '@/lib/export/fields';

export type ExportFieldConfig = Record<ExportFieldKey, boolean>;

const STORAGE_KEY = 'omni-tract:export-fields';

/** Mặc định: bật TẤT CẢ field (export đầy đủ dữ liệu từ IndexedDB). */
const DEFAULT_CONFIG: ExportFieldConfig = Object.fromEntries(
  ALL_FIELD_KEYS.map((k) => [k, true]),
) as ExportFieldConfig;

function load(): ExportFieldConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    // Merge với DEFAULT → field mới (sau này thêm) mặc định bật, field lạ bị bỏ qua khi resolve.
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ExportFieldConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function persist(c: ExportFieldConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // localStorage đầy/chặn → bỏ qua, vẫn giữ state trong phiên.
  }
}

interface ExportFieldsStore {
  fields: ExportFieldConfig;
  /** Đã nạp từ localStorage chưa (tránh đọc localStorage trong initializer → lệch SSR). */
  hydrated: boolean;
  hydrate: () => void;
  setFields: (fields: ExportFieldConfig) => void;
}

/** Cấu hình field xuất dữ liệu — chia sẻ giữa modal Settings và nút Export, lưu localStorage. */
export const useExportFieldsStore = create<ExportFieldsStore>((set, get) => ({
  fields: DEFAULT_CONFIG,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ fields: load(), hydrated: true });
  },
  setFields: (fields) => {
    persist(fields);
    set({ fields });
  },
}));
