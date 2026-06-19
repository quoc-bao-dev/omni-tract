import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';

interface ContentStore {
  rows: ContentRow[];
  /** Đã nạp dữ liệu từ IndexedDB chưa (tránh hydrate đè lên import trong phiên). */
  hydrated: boolean;
  /** Thêm rows vào ĐẦU bảng (nội dung user vừa import). */
  prepend: (rows: ContentRow[]) => void;
  /** Cập nhật 1 row theo id (merge). */
  patchRow: (id: string, patch: Partial<ContentRow>) => void;
  /** Xoá các row theo id. */
  remove: (ids: string[]) => void;
  /** Nạp 1 lần từ IndexedDB lúc mount; gọi lại không có tác dụng. */
  hydrate: (rows: ContentRow[]) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  rows: [],
  hydrated: false,
  prepend: (rows) => set((s) => ({ rows: [...rows, ...s.rows] })),
  patchRow: (id, patch) =>
    set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  remove: (ids) =>
    set((s) => {
      const drop = new Set(ids);
      return { rows: s.rows.filter((r) => !drop.has(r.id)) };
    }),
  hydrate: (rows) => set((s) => (s.hydrated ? s : { rows, hydrated: true })),
}));
