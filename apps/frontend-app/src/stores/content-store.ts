import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';

interface ContentStore {
  rows: ContentRow[];
  /** Thêm rows vào ĐẦU bảng (nội dung user vừa import). */
  prepend: (rows: ContentRow[]) => void;
  /** Cập nhật 1 row theo id (merge). */
  patchRow: (id: string, patch: Partial<ContentRow>) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  rows: [],
  prepend: (rows) => set((s) => ({ rows: [...rows, ...s.rows] })),
  patchRow: (id, patch) =>
    set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
}));
