import { create } from 'zustand';
import {
  EMPTY_FILTER,
  type FilterGroupKey,
  type FilterValue,
  isFilterActive,
} from '@/features/content-filter/filters';

interface FilterStore {
  value: FilterValue;
  /** Commit toàn bộ filter (Apply trong drawer). */
  apply: (value: FilterValue) => void;
  /** Bỏ 1 tag khỏi 1 nhóm. */
  removeTag: (group: FilterGroupKey, optionValue: string) => void;
  /** Xoá hết filter. */
  clear: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  value: EMPTY_FILTER,
  apply: (value) => set({ value }),
  removeTag: (group, optionValue) =>
    set((s) => ({
      value: { ...s.value, [group]: s.value[group].filter((x) => x !== optionValue) },
    })),
  clear: () => set({ value: EMPTY_FILTER }),
}));

/**
 * Hook tiện dụng — selector từng field (ref ổn định, tránh re-render thừa).
 * `isActive` tính từ value mỗi render (rẻ).
 */
export function useFilters() {
  const value = useFilterStore((s) => s.value);
  const apply = useFilterStore((s) => s.apply);
  const removeTag = useFilterStore((s) => s.removeTag);
  const clear = useFilterStore((s) => s.clear);
  return { value, apply, removeTag, clear, isActive: isFilterActive(value) };
}
