import { create } from 'zustand';

interface SelectionStore {
  /** Id các dòng đang chọn trong bảng. */
  selected: Set<string>;
  toggle: (id: string) => void;
  /** Thêm 1 dải id vào tập chọn (shift+click chọn khoảng), giữ các dòng đã chọn trước đó. */
  selectRange: (ids: string[]) => void;
  /** Đặt nguyên tập chọn (vd chọn/bỏ tất cả). */
  set: (ids: string[]) => void;
  clear: () => void;
}

/** Chọn dòng bảng — chia sẻ giữa ContentTable và nút Delete ở Navbar. */
export const useSelectionStore = create<SelectionStore>((set) => ({
  selected: new Set(),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selected: next };
    }),
  selectRange: (ids) =>
    set((s) => {
      const next = new Set(s.selected);
      for (const id of ids) next.add(id);
      return { selected: next };
    }),
  set: (ids) => set({ selected: new Set(ids) }),
  clear: () => set({ selected: new Set() }),
}));
