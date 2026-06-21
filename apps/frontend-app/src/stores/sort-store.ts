import { create } from 'zustand';
import type { ColumnKey } from '@/stores/column-store';

/** Cột sort được = mọi cột trừ `url` (và checkbox/No. vốn không phải cột dữ liệu). */
export type SortKey = Exclude<ColumnKey, 'url'>;
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface SortStore {
  /** null = không sort. */
  sort: SortState | null;
  /** Cycle 1 cột: không-sort → asc → desc → không-sort. Chọn cột khác → cột cũ về không-sort. */
  toggle: (key: SortKey) => void;
  clear: () => void;
}

/** Sort bảng (1 cột tại 1 thời điểm) — transient, KHÔNG lưu; clear khi import mới (giống filter). */
export const useSortStore = create<SortStore>((set) => ({
  sort: null,
  toggle: (key) =>
    set((s) => {
      if (s.sort?.key !== key) return { sort: { key, dir: 'asc' } };
      if (s.sort.dir === 'asc') return { sort: { key, dir: 'desc' } };
      return { sort: null }; // đang desc → bỏ sort
    }),
  clear: () => set({ sort: null }),
}));
