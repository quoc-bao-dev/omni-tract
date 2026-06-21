import { create } from 'zustand';

interface SearchStore {
  /** Từ khoá tìm kiếm (free-text). '' = không tìm. */
  query: string;
  set: (query: string) => void;
  clear: () => void;
}

/** Tìm kiếm bảng (free-text) — transient, KHÔNG lưu; clear khi import mới (giống filter/sort). */
export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  set: (query) => set({ query }),
  clear: () => set({ query: '' }),
}));
